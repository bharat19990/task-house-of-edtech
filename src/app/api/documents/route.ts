import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import DocumentModel from '@/models/Document';
import Collaborator from '@/models/Collaborator';
import { validateCreateDocument } from '@/lib/sync/payloadValidator';
import logger from '@/lib/logger';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const userId = session.user.id;

    const collaborations = await Collaborator.find({ userId }).select('documentId role');
    const collaboratedDocIds = collaborations.map((c) => c.documentId);

    const documents = await DocumentModel.find({
      $or: [{ ownerId: userId }, { _id: { $in: collaboratedDocIds } }],
      isDeleted: false,
    })
      .sort({ updatedAt: -1 })
      .lean();

    const roleMap = new Map<string, string>();
    collaborations.forEach((c) => {
      roleMap.set(c.documentId.toString(), c.role);
    });

    const docIds = documents.map((d) => d._id);
    const collabCounts = await Collaborator.aggregate([
      { $match: { documentId: { $in: docIds } } },
      { $group: { _id: '$documentId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map<string, number>();
    collabCounts.forEach((c: { _id: { toString: () => string }; count: number }) => {
      countMap.set(c._id.toString(), c.count);
    });

    const result = documents.map((doc) => ({
      id: doc._id.toString(),
      title: doc.title,
      ownerId: doc.ownerId.toString(),
      content: doc.content?.substring(0, 200) ?? '',
      isDeleted: doc.isDeleted,
      role: doc.ownerId.toString() === userId ? 'owner' : (roleMap.get(doc._id.toString()) ?? 'viewer'),
      collaboratorCount: countMap.get(doc._id.toString()) ?? 0,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, 'Failed to list documents');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = validateCreateDocument(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 });
    }

    await connectToDatabase();
    const userId = session.user.id;

    const doc = await DocumentModel.create({
      title: validation.data.title,
      ownerId: userId,
      content: '',
      yjsState: Buffer.from([]),
    });

    await Collaborator.create({
      documentId: doc._id,
      userId,
      role: 'owner',
    });

    logger.info({ docId: doc._id.toString(), userId }, 'Document created');

    return NextResponse.json(
      {
        id: doc._id.toString(),
        title: doc.title,
        ownerId: userId,
        content: '',
        isDeleted: false,
        role: 'owner',
        collaboratorCount: 1,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    logger.error({ error }, 'Failed to create document');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
