import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import DocumentModel from '@/models/Document';
import DocumentVersion from '@/models/DocumentVersion';
import Collaborator from '@/models/Collaborator';
import { validateCreateVersion } from '@/lib/sync/payloadValidator';
import logger from '@/lib/logger';

interface RouteParams {
  params: Promise<{ docId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { docId } = await params;
    await connectToDatabase();
    const userId = session.user.id;

    const collab = await Collaborator.findOne({ documentId: docId, userId });
    const doc = await DocumentModel.findById(docId);
    if (!doc || doc.isDeleted) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const isOwner = doc.ownerId.toString() === userId;
    if (!isOwner && !collab) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const versions = await DocumentVersion.find({ documentId: docId })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name')
      .lean();

    const result = versions.map((v) => ({
      id: v._id.toString(),
      documentId: v.documentId.toString(),
      createdBy: v.createdBy?.toString() ?? '',
      createdByName: (v.createdBy as unknown as { name: string })?.name ?? 'Unknown',
      label: v.label,
      contentSnapshot: v.contentSnapshot?.substring(0, 500) ?? '',
      createdAt: v.createdAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, 'Failed to list versions');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { docId } = await params;
    const body = await request.json();
    const validation = validateCreateVersion(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 });
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

    if (role !== 'owner' && role !== 'editor') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const version = await DocumentVersion.create({
      documentId: docId,
      createdBy: userId,
      label: validation.data.label,
      yjsSnapshot: Buffer.from(validation.data.yjsSnapshot, 'base64'),
      contentSnapshot: validation.data.contentSnapshot,
    });

    logger.info({ docId, versionId: version._id.toString(), userId }, 'Version created');

    return NextResponse.json(
      {
        id: version._id.toString(),
        documentId: docId,
        createdBy: userId,
        label: version.label,
        contentSnapshot: version.contentSnapshot?.substring(0, 500) ?? '',
        createdAt: version.createdAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error({ error }, 'Failed to create version');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
