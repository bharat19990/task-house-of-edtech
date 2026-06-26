import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import DocumentModel from '@/models/Document';
import Collaborator from '@/models/Collaborator';
import User from '@/models/User';
import { validateAddCollaborator } from '@/lib/sync/payloadValidator';
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

    const collaborators = await Collaborator.find({ documentId: docId })
      .populate('userId', 'name email')
      .lean();

    const result = collaborators.map((c) => {
      const user = c.userId as unknown as { _id: { toString: () => string }; name: string; email: string };
      return {
        _id: c._id.toString(),
        documentId: c.documentId.toString(),
        userId: user._id.toString(),
        userName: user.name,
        userEmail: user.email,
        role: c.role,
        addedAt: c.addedAt.toISOString(),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, 'Failed to list collaborators');
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
    const validation = validateAddCollaborator(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 });
    }

    await connectToDatabase();
    const userId = session.user.id;

    const doc = await DocumentModel.findById(docId);
    if (!doc || doc.isDeleted) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.ownerId.toString() !== userId) {
      return NextResponse.json({ error: 'Only owners can add collaborators' }, { status: 403 });
    }

    const targetUser = await User.findOne({ email: validation.data.email });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found with that email' }, { status: 404 });
    }

    const existing = await Collaborator.findOne({
      documentId: docId,
      userId: targetUser._id,
    });

    if (existing) {
      return NextResponse.json({ error: 'User is already a collaborator' }, { status: 409 });
    }

    const collab = await Collaborator.create({
      documentId: docId,
      userId: targetUser._id,
      role: validation.data.role,
    });

    logger.info(
      { docId, targetUserId: targetUser._id.toString(), role: validation.data.role },
      'Collaborator added',
    );

    return NextResponse.json(
      {
        _id: collab._id.toString(),
        documentId: docId,
        userId: targetUser._id.toString(),
        userName: targetUser.name,
        userEmail: targetUser.email,
        role: collab.role,
        addedAt: collab.addedAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error({ error }, 'Failed to add collaborator');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { docId } = await params;
    const body = await request.json();
    const collaboratorId = body.collaboratorId as string;

    if (!collaboratorId) {
      return NextResponse.json({ error: 'collaboratorId is required' }, { status: 400 });
    }

    await connectToDatabase();
    const userId = session.user.id;

    const doc = await DocumentModel.findById(docId);
    if (!doc || doc.isDeleted) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.ownerId.toString() !== userId) {
      return NextResponse.json({ error: 'Only owners can remove collaborators' }, { status: 403 });
    }

    const collab = await Collaborator.findById(collaboratorId);
    if (!collab) {
      return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 });
    }

    if (collab.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove the owner' }, { status: 400 });
    }

    await Collaborator.findByIdAndDelete(collaboratorId);

    logger.info({ docId, collaboratorId }, 'Collaborator removed');

    return NextResponse.json({ success: true, message: 'Collaborator removed' });
  } catch (error) {
    logger.error({ error }, 'Failed to remove collaborator');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
