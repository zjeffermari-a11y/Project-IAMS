import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export interface UserDoc {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useUsers(roleFilter?: string[]) {
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const usersRef = collection(db, 'users');
        let q = query(usersRef);
        if (roleFilter && roleFilter.length > 0) {
          q = query(usersRef, where('role', 'in', roleFilter));
        }
        
        const snapshot = await getDocs(q);
        const results: UserDoc[] = [];
        snapshot.forEach(doc => {
          results.push({ id: doc.id, ...doc.data() } as UserDoc);
        });
        setUsers(results);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'users');
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [roleFilter?.join(',')]);

  return { users, loading };
}
