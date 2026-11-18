import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { useTravelMate } from '../../context/TravelMateContext';
import { formatPkr } from '../../lib/formatters';
import type { ExpenseCategory } from '../../types/travelmate';

const CATEGORIES: ExpenseCategory[] = [
  'Accommodation',
  'Transportation',
  'Food',
  'Activities',
  'Shopping',
  'Tour guide',
  'Miscellaneous',
];

export function BudgetManagerPanel() {
  const { expenses, itineraries, userProfile, addExpense, deleteExpense } = useTravelMate();

  const [tripBudgetPkr, setTripBudgetPkr] = useState<number>(
    itineraries[0]?.budgetPkr || 45000
  );
  const [tripTitle, setTripTitle] = useState(
    itineraries[0]?.title || 'Hunza Valley Expedition'
  );
  const [category, setCategory] = useState<ExpenseCategory>('Transportation');
  const [description, setDescription] = useState('');
  const [amountPkr, setAmountPkr] = useState<number>(3500);
  const [date, setDate] = useState('2026-12-01');
  const [isShared, setIsShared] = useState(false);
  const [paidByName, setPaidByName] = useState(userProfile?.displayName || 'Me');
  const [splitMembersText, setSplitMembersText] = useState('Me, Ali, Zainab');

  const totalSpent = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amountPkr || 0), 0),
    [expenses]
  );

  const remainingPkr = tripBudgetPkr - totalSpent;

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    CATEGORIES.forEach((c) => {
      map[c] = 0;
    });
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amountPkr;
    });
    return map;
  }, [expenses]);

  // Group settlement calculator
  const settlements = useMemo(() => {
    const shared = expenses.filter((e) => e.isShared && e.splitMembers && e.splitMembers.length > 1);
    const netBalance: Record<string, number> = {};
    shared.forEach((e) => {
      const members = e.splitMembers || [];
      const share = e.amountPkr / members.length;
      const payer = e.paidByName || 'Me';
      netBalance[payer] = (netBalance[payer] || 0) + e.amountPkr;
      members.forEach((m) => {
        netBalance[m] = (netBalance[m] || 0) - share;
      });
    });
    return Object.entries(netBalance).map(([name, net]) => ({
      name,
      net: Math.round(net),
    }));
  }, [expenses]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || amountPkr <= 0) return;
    const splitMembers = isShared
      ? splitMembersText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    await addExpense({
      tripTitle,
      category,
      description: description.trim(),
      amountPkr,
      date,
      isShared,
      paidByName: isShared ? paidByName.trim() || 'Me' : '',
      splitMembers,
    });
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#0F172A]">
            Smart Budget &amp; Group Expense Manager
          </h2>
          <p className="text-sm text-[#0F172A]/70 mt-1">
            Track trip expenditure in PKR, compare against planned budget, and settle shared costs.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#0F172A]/70">Target Trip Budget (PKR):</span>
          <input
            type="number"
            step={1000}
            value={tripBudgetPkr}
            onChange={(e) => setTripBudgetPkr(Number(e.target.value) || 0)}
            className="w-32 px-3 py-1.5 font-mono tabular-nums bg-white border border-slate-200 rounded-lg"
          />
        </div>
      </div>

      {/* Budget Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-[#0F172A]/60">Target Budget</div>
          <div className="font-mono text-2xl font-bold text-[#0F172A] tabular-nums mt-1">
            {formatPkr(tripBudgetPkr)}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-[#0F172A]/60">Total Actual Spent</div>
          <div className="font-mono text-2xl font-bold text-[#0D5EFF] tabular-nums mt-1">
            {formatPkr(totalSpent)}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="text-xs text-[#0F172A]/60">Remaining Balance</div>
          <div
            className={`font-mono text-2xl font-bold tabular-nums mt-1 ${
              remainingPkr >= 0 ? 'text-[#0B57D0]' : 'text-red-600'
            }`}
          >
            {formatPkr(remainingPkr)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Log New Expense */}
        <form
          onSubmit={handleAdd}
          className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-3"
        >
          <h3 className="font-display font-bold text-base text-[#0F172A]">Log Expense</h3>
          <input
            type="text"
            required
            value={tripTitle}
            onChange={(e) => setTripTitle(e.target.value)}
            placeholder="Trip title"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
          />
          <div className="grid grid-cols-2 gap-2.5">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Expense item (e.g., Fuel, Dinner)"
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg"
            />
            <input
              type="number"
              required
              min={1}
              value={amountPkr}
              onChange={(e) => setAmountPkr(Number(e.target.value) || 0)}
              placeholder="Amount PKR"
              className="px-3 py-2 text-sm font-mono tabular-nums border border-slate-200 rounded-lg"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-[#0F172A] cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isShared}
              onChange={(e) => setIsShared(e.target.checked)}
              className="accent-[#0D5EFF]"
            />
            <span>Split as shared group expense</span>
          </label>

          {isShared && (
            <div className="grid grid-cols-2 gap-2.5 bg-[#F4F7FC] p-3 rounded-lg">
              <div>
                <label className="block text-[11px] text-[#0F172A]/70 mb-1">Paid By</label>
                <input
                  type="text"
                  value={paidByName}
                  onChange={(e) => setPaidByName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#0F172A]/70 mb-1">
                  Members (comma separated)
                </label>
                <input
                  type="text"
                  value={splitMembersText}
                  onChange={(e) => setSplitMembersText(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 bg-[#0D5EFF] text-white text-sm font-semibold rounded-lg hover:bg-[#0948CC] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Expense</span>
          </button>
        </form>

        {/* Category Breakdown & Group Settlements */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="font-display font-bold text-base text-[#0F172A]">
              Category Breakdown
            </h3>
            <div className="space-y-2.5">
              {CATEGORIES.map((cat) => {
                const val = byCategory[cat] || 0;
                const pct = totalSpent > 0 ? Math.round((val / totalSpent) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#0F172A]/80">{cat}</span>
                      <span className="font-mono font-semibold tabular-nums text-[#0D5EFF]">
                        {formatPkr(val)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-[#F4F7FC] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0B57D0]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {settlements.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2 font-display font-bold text-base text-[#0F172A]">
                <Users className="w-4 h-4 text-[#0B57D0]" />
                <span>Group Split Net Balances</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {settlements.map((s) => (
                  <div key={s.name} className="bg-[#F4F7FC] rounded-lg p-3 text-xs">
                    <div className="font-semibold text-[#0F172A]">{s.name}</div>
                    <div
                      className={`font-mono font-bold tabular-nums mt-0.5 ${
                        s.net >= 0 ? 'text-[#0B57D0]' : 'text-red-600'
                      }`}
                    >
                      {s.net >= 0 ? `Receives ${formatPkr(s.net)}` : `Owes ${formatPkr(Math.abs(s.net))}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expense Ledger */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 font-display font-bold text-sm text-[#0F172A]">
          Recorded Expenses ({expenses.length})
        </div>
        {expenses.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#0F172A]/60">
            No expenses logged yet. Add your first trip expenditure above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#F4F7FC] text-xs text-[#0F172A]/65">
                <tr>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Description</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Split</th>
                  <th className="px-5 py-3 font-medium text-right">Amount</th>
                  <th className="px-5 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#F4F7FC]/60">
                    <td className="px-5 py-3 font-mono text-xs tabular-nums">{exp.date}</td>
                    <td className="px-5 py-3 font-medium text-[#0F172A]">{exp.description}</td>
                    <td className="px-5 py-3 text-xs text-[#0F172A]/75">{exp.category}</td>
                    <td className="px-5 py-3 text-xs text-[#0F172A]/70">
                      {exp.isShared ? `Shared (${exp.paidByName})` : 'Personal'}
                    </td>
                    <td className="px-5 py-3 font-mono font-semibold text-right tabular-nums text-[#0D5EFF]">
                      {formatPkr(exp.amountPkr)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void deleteExpense(exp.id)}
                        className="p-1.5 text-[#0F172A]/50 hover:text-red-600 cursor-pointer"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
