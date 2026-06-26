import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import DocumentModel from '@/models/Document';
import Collaborator from '@/models/Collaborator';
import SyncLog from '@/models/SyncLog';
import { validateSyncPayload } from '@/lib/sync/payloadValidator';
import { checkRateLimit } from '@/lib/security/rateLimiter';
import { checkPayloadSize, checkParsedBodySize, readBodyWithLimit } from '@/lib/security/payloadSizeGuard';
import logger from '@/lib/logger';

interface RouteParams {
  params: Promise<{ docId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sizeError = checkPayloadSize(request);
    if (sizeError) return sizeError;

    const rateLimitResult = checkRateLimit(session.user.id);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfterSeconds },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfterSeconds ?? 60),
          },
        },
      );
    }

    const { docId } = await params;
    
    let body: unknown;
    try {
      const bodyText = await readBodyWithLimit(request);
      body = JSON.parse(bodyText);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '';
      if (errorMessage === 'PAYLOAD_TOO_LARGE') {
        return NextResponse.json(
          { error: 'Payload too large', message: 'Maximum payload size is 2MB' },
          { status: 413 }
        );
      }
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const sizeErrorParsed = checkParsedBodySize(body);
    if (sizeErrorParsed) return sizeErrorParsed;

    const validation = validateSyncPayload(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 },
      );
    }

    await connectToDatabase();
    const userId = session.user.id;

    const collab = await Collaborator.findOne({ documentId: docId, userId });
    const doc = await DocumentModel.findById(docId);

    if (!doc || doc.isDeleted) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const isOwner = doc.ownerId.toString() === userId;
    const role = isOwner ? 'owner' : collab?.role;

    if (role === 'viewer') {
      return NextResponse.json({ error: 'Viewers cannot sync changes' }, { status: 403 });
    }

    if (!isOwner && !collab) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateBuffer = Buffer.from(validation.data.yjsUpdate, 'base64');

    const Y = await import('yjs');
    const serverDoc = new Y.Doc();

    if (doc.yjsState && doc.yjsState.length > 0) {
      Y.applyUpdate(serverDoc, new Uint8Array(doc.yjsState));
    }

    Y.applyUpdate(serverDoc, new Uint8Array(updateBuffer));

    const mergedState = Y.encodeStateAsUpdate(serverDoc);
    const contentFragment = serverDoc.getXmlFragment('default');
    const plainContent = contentFragment.toJSON();

    doc.yjsState = Buffer.from(mergedState);
    doc.content = typeof plainContent === 'string' ? plainContent : JSON.stringify(plainContent);
    await doc.save();

    serverDoc.destroy();

    await SyncLog.create({
      documentId: docId,
      userId,
      clientId: validation.data.clientId,
      operation: 'sync',
      payloadSizeBytes: updateBuffer.length,
      status: 'success',
    });

    logger.info({ docId, userId, bytes: updateBuffer.length }, 'Sync payload applied');

    return NextResponse.json({
      success: true,
      serverState: Buffer.from(mergedState).toString('base64'),
    });
  } catch (error) {
    logger.error({ error }, 'Sync endpoint error');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
