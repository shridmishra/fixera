'use client'

import React from 'react';
import { iconMap } from '@/data/content';

const Icon = ({ name, className }: { name: string; className?: string }) => {
  const LucideIcon = iconMap[name as keyof typeof iconMap];
  if (!LucideIcon) {
    return null;
  }
  return <LucideIcon className={className} />;
};

export default Icon;