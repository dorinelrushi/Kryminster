// Forced recompilation comment
import { NextResponse } from 'next/server';
import { getVotesCollection } from '../../../../lib/mongodb';

/**
 * GET /api/vote
 * Returns the current vote counts per candidate and vote type.
 */
export async function GET() {
  try {
    const collection = await getVotesCollection();
    const agg = await collection
      .aggregate([
        {
          $group: {
            _id: { candidate: '$candidate', vote: '$vote' },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            key: { $concat: ['$_id.candidate', '|', '$_id.vote'] },
            count: 1,
          },
        },
      ])
      .toArray();

    const result: Record<string, number> = {};
    agg.forEach((doc: any) => {
      result[doc.key] = doc.count;
    });
    return NextResponse.json({ success: true, counts: result });
  } catch (error: any) {
    console.error('Vote GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/vote
 * Body: { candidate: string, vote: 'yes' | 'no' }
 * Records a vote — one vote per IP address per candidate (unique index).
 */
export async function POST(request: Request) {
  try {
    const { candidate, vote } = await request.json();

    if (!candidate || !vote) {
      return NextResponse.json(
        { error: 'candidate and vote are required' },
        { status: 400 }
      );
    }

    // Get real client IP
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown';

    const collection = await getVotesCollection();

    // Ensure unique constraint: one vote per IP per candidate
    try {
      await collection.createIndex({ ip: 1, candidate: 1 }, { unique: true });
    } catch {
      // Index already exists — ignore
    }

    // Insert vote (will throw duplicate key error if IP already voted for this candidate)
    await collection.insertOne({ candidate, vote, ip, createdAt: new Date() });

    // Return fresh counts
    const agg = await collection
      .aggregate([
        {
          $group: {
            _id: { candidate: '$candidate', vote: '$vote' },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            key: { $concat: ['$_id.candidate', '|', '$_id.vote'] },
            count: 1,
          },
        },
      ])
      .toArray();

    const result: Record<string, number> = {};
    agg.forEach((doc: any) => {
      result[doc.key] = doc.count;
    });

    return NextResponse.json({ success: true, counts: result });
  } catch (error: any) {
    console.error('Vote POST error:', error);

    // MongoDB duplicate key error code = 11000
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'Ju keni votuar tashmë! Mund të votoni vetëm një herë.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
