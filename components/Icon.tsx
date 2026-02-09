'use client'

import React from 'react';
import { iconMap } from '@/data/content';

const isIconName = (name: string): name is keyof typeof iconMap =>
  Object.prototype.hasOwnProperty.call(iconMap, name);

const Icon = ({ name, className }: { name: string; className?: string }) => {
  if (!isIconName(name)) {
    return null;
  }
  const LucideIcon = iconMap[name];
  return <LucideIcon className={className} />;
};

export default Icon;
