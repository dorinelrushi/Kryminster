import { NextResponse } from 'next/server';
import { getCommentsCollection } from '../../../../lib/mongodb';

export async function GET() {
  try {
    const collection = await getCommentsCollection();
    const comments = await collection.find({}).sort({ createdAt: -1 }).toArray();
    
    return NextResponse.json({ success: true, comments });
  } catch (error: any) {
    console.error('Comments GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: 'Koment bosh nuk lejohet' },
        { status: 400 }
      );
    }

    const collection = await getCommentsCollection();
    
    const newComment = {
      text: text.trim(),
      createdAt: new Date(),
      // Anonymous, so no user ID needed
    };

    await collection.insertOne(newComment);

    return NextResponse.json({ success: true, comment: newComment });
  } catch (error: any) {
    console.error('Comments POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
