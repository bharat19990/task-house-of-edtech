import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import DocumentModel from '@/models/Document';
import DocumentVersion from '@/models/DocumentVersion';
import Collaborator from '@/models/Collaborator';
import logger from '@/lib/logger';

interface RouteParams {
  params: Promise<{ docId: string; versionId: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { docId, versionId } = await params;
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

    const version = await DocumentVersion.findOne({
      _id: versionId,
      documentId: docId,
    })
      .populate('createdBy', 'name')
      .lean();

    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: version._id.toString(),
      documentId: version.documentId.toString(),
      createdBy: version.createdBy?.toString() ?? '',
      createdByName: (version.createdBy as unknown as { name: string })?.name ?? 'Unknown',
      label: version.label,
      yjsSnapshot: version.yjsSnapshot
        ? Buffer.from(version.yjsSnapshot).toString('base64')
        : '',
      contentSnapshot: version.contentSnapshot,
      createdAt: version.createdAt.toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get version');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { docId, versionId } = await params;
    await connectToDatabase();
    const userId = session.user.id;

    const doc = await DocumentModel.findById(docId);
    if (!doc || doc.isDeleted) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.ownerId.toString() !== userId) {
      return NextResponse.json({ error: 'Only owners can restore versions' }, { status: 403 });
    }

    const version = await DocumentVersion.findOne({ _id: versionId, documentId: docId });
    if (!version) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    await DocumentVersion.create({
      documentId: docId,
      createdBy: userId,
      label: `Auto-save before restoring "${version.label}"`,
      yjsSnapshot: doc.yjsState,
      contentSnapshot: doc.content,
    });

    const Y = await import('yjs');
    const restoredDoc = new Y.Doc();

    if (version.yjsSnapshot && version.yjsSnapshot.length > 0) {
      Y.applyUpdate(restoredDoc, new Uint8Array(version.yjsSnapshot));
    }

    const restoredState = Y.encodeStateAsUpdate(restoredDoc);
    doc.yjsState = Buffer.from(restoredState);
    doc.content = version.contentSnapshot;
    await doc.save();

    restoredDoc.destroy();

    logger.info(
      { docId, versionId, userId, label: version.label },
      'Document restored to version',
    );

    return NextResponse.json({
      success: true,
      message: `Document restored to "${version.label}"`,
      serverState: Buffer.from(restoredState).toString('base64'),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to restore version');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
