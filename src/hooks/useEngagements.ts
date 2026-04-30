import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export interface Engagement {
  id: string;
  title: string;
  typeOfAudit: string;
  periodStart: string;
  periodEnd: string;
  teamLeaderId: string;
  auditeeId: string;
  status: string;
  memberIds: string[];
  createdAt: number;
  updatedAt: number;
}

export function useEngagements() {
  const { user, profile } = useAuth();
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !profile) return;

    const engagementsRef = collection(db, 'engagements');
    let q;
    
    if (profile.role === 'Director' || profile.role === 'Division Chief') {
      q = query(engagementsRef);
    } else {
      q = query(engagementsRef, where('memberIds', 'array-contains', user.uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results: Engagement[] = [];
      snapshot.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() } as Engagement);
      });
      setEngagements(results);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'engagements');
    });

    return unsubscribe;
  }, [user, profile]);

  return { engagements, loading };
}
