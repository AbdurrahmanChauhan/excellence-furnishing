'use client';

import * as React from 'react';
import { FabricVisualizer } from '@/components/visualizer/FabricVisualizer';

export default function UserVisualizerPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <FabricVisualizer isAdmin={false} />
    </div>
  );
}
