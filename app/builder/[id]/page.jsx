'use client';

import { use } from 'react';
import Builder from '../../../components/Builder';

export default function BuilderPage({ params }) {
  const { id } = use(params);
  return <Builder projectId={id} />;
}
