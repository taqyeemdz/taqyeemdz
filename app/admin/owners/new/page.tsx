// app/admin/owner/new/page.tsx
import { createOwner } from "./actions";

export default function NewOwnerPage() {
  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-4">Create Owner</h1>

      <form action={createOwner} className="space-y-4">
        <input
          name="full_name"
          type="text"
          placeholder="Owner Full Name"
          required
          className="w-full border p-2 rounded"
        />

        <input
          name="email"
          type="email"
          placeholder="Owner email"
          required
          className="w-full border p-2 rounded"
        />

        <input
          name="password"
          type="password"
          placeholder="Temporary password"
          required
          className="w-full border p-2 rounded"
        />

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded"
        >
          Create Owner
        </button>
      </form>
    </div>
  );
}
