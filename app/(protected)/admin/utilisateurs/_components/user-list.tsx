import { FolderOpen } from "lucide-react";

import {
  type User,
  UserCard,
} from "@/app/(protected)/admin/utilisateurs/_components/user-card";

type UserListProps = {
  users: User[];
};

function UserList({ users }: UserListProps) {
  if (users.length === 0) {
    return (
      <section className="flex flex-col items-center justify-center py-12 text-center">
        <FolderOpen
          className="text-muted-foreground h-12 w-12"
          aria-hidden="true"
        />
        <h3 className="mt-4 text-lg font-medium">Aucun utilisateur</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Créez votre premier utilisateur pour commencer.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {users.map((user: User) => (
        <UserCard key={user.id} user={user} />
      ))}
    </section>
  );
}

export { UserList };
