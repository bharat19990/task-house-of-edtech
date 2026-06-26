import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import DocumentModel from '@/models/Document';
import Collaborator from '@/models/Collaborator';
import { validateUpdateDocument } from '@/lib/sync/payloadValidator';
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

    const doc = await DocumentModel.findById(docId).lean();
    if (!doc || doc.isDeleted) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const collab = await Collaborator.findOne({ documentId: docId, userId });
    const isOwner = doc.ownerId.toString() === userId;

    if (!isOwner && !collab) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const role = isOwner ? 'owner' : collab?.role ?? 'viewer';

    const yjsStateBase64 = doc.yjsState
      ? Buffer.from(doc.yjsState).toString('base64')
      : '';

    return NextResponse.json({
      id: doc._id.toString(),
      title: doc.title,
      ownerId: doc.ownerId.toString(),
      content: doc.content,
      yjsState: yjsStateBase64,
      isDeleted: doc.isDeleted,
      role,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to get document');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { docId } = await params;
    const body = await request.json();
    const validation = validateUpdateDocument(body);
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

    if (validation.data.title) doc.title = validation.data.title;
    if (validation.data.content !== undefined) doc.content = validation.data.content;
    await doc.save();

    logger.info({ docId, userId }, 'Document updated');

    return NextResponse.json({
      id: doc._id.toString(),
      title: doc.title,
      updatedAt: doc.updatedAt.toISOString(),
    });
  } catch (error) {
    logger.error({ error }, 'Failed to update document');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { docId } = await params;
    await connectToDatabase();
    const userId = session.user.id;

    const doc = await DocumentModel.findById(docId);
    if (!doc || doc.isDeleted) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.ownerId.toString() !== userId) {
      return NextResponse.json({ error: 'Only the owner can delete this document' }, { status: 403 });
    }

    doc.isDeleted = true;
    await doc.save();

    logger.info({ docId, userId }, 'Document soft-deleted');

    return NextResponse.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    logger.error({ error }, 'Failed to delete document');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
