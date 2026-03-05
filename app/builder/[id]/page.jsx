
'use client';

import Builder from '../../../components/Builder';

export default function BuilderPage({ params }) {
  return <Builder projectId={params.id} />;
}
