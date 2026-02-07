/**
 * Custom Scoring Models API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { scoringModelService } from '@/lib/services/scoring-model-service';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const models = await scoringModelService.getModelsForUser(userId);

    return NextResponse.json({ models });
  } catch (error: any) {
    console.error('Error fetching scoring models:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch scoring models' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { name, description, config, isGlobal = false } = body;

    // Only admins can create global models
    const user = await db.user.findUnique({ where: { id: userId } });
    if (isGlobal && user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only admins can create global models' }, { status: 403 });
    }

    const model = await scoringModelService.createModel(
      isGlobal ? null : userId,
      name,
      description,
      config
    );

    return NextResponse.json({
      success: true,
      model,
    });
  } catch (error: any) {
    console.error('Error creating scoring model:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create scoring model' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();
    const { modelId, ...updates } = body;

    // Verify ownership
    const model = await db.scoringModel.findUnique({ where: { id: modelId } });
    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    if (model.userId && model.userId !== userId) {
      // Check if user is admin
      const user = await db.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const updatedModel = await scoringModelService.updateModel(modelId, updates);

    return NextResponse.json({
      success: true,
      model: updatedModel,
    });
  } catch (error: any) {
    console.error('Error updating scoring model:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update scoring model' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('id');

    if (!modelId) {
      return NextResponse.json({ error: 'Model ID required' }, { status: 400 });
    }

    // Verify ownership
    const model = await db.scoringModel.findUnique({ where: { id: modelId } });
    if (!model) {
      return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    }

    if (model.userId && model.userId !== userId) {
      // Check if user is admin
      const user = await db.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    await scoringModelService.deleteModel(modelId);

    return NextResponse.json({
      success: true,
      message: 'Scoring model deleted',
    });
  } catch (error: any) {
    console.error('Error deleting scoring model:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete scoring model' },
      { status: 500 }
    );
  }
}
