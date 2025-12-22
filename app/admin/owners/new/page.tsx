// app/admin/owners/new/page.tsx
import { createOwner } from "./actions";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function NewOwnerPage() {
  const supabase = await createSupabaseServer();
  const { data: plans } = await supabase
    .from("subscription_plans")
    .select("id, name, price, currency")
    .order("price", { ascending: true });

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <h1 className="text-2xl font-bold mb-6">Create New Owner</h1>

      <form action={createOwner} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
          <input
            name="full_name"
            type="text"
            placeholder="Owner Full Name"
            required
            className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
          <input
            name="email"
            type="email"
            placeholder="Owner email"
            required
            className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Temporary Password</label>
          <input
            name="password"
            type="password"
            placeholder="Assign a password"
            required
            className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Subscription Plan</label>
          <select
            name="plan_id"
            required
            className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all bg-white"
          >
            <option value="" disabled selected>Select a plan...</option>
            {plans?.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} ({plan.price} {plan.currency}/mo)
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all active:scale-[0.98] shadow-lg shadow-gray-200 mt-4"
        >
          Create Owner & Assign Plan
        </button>
      </form>
    </div>
  );
}
