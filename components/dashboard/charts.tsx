'use client'

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { clinicLoad, monthlyTrend, outcomeSplit, weeklyScreenings } from '@/lib/data'

const PURPLE = '#6b21a8'
const LAVENDER = '#a78bfa'
const ORANGE = '#f08a5d'
const PEACH = '#fbbf9b'
const GRID = '#ece8f7'
const AXIS = '#8a85a3'

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e6e2f3',
  boxShadow: '0 8px 24px -12px rgba(76,29,149,0.3)',
  fontSize: 12,
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="h-1.5 w-4 rounded-full" style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  )
}

export function TrendChart() {
  return (
    <div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={monthlyTrend} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fillPurple" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={LAVENDER} stopOpacity={0.35} />
                <stop offset="100%" stopColor={LAVENDER} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 11 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey="screenings"
              name="Screenings"
              stroke={PURPLE}
              strokeWidth={2.5}
              fill="url(#fillPurple)"
              dot={{ r: 4, fill: '#fff', stroke: PURPLE, strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="referrals"
              name="Referrals"
              stroke={ORANGE}
              strokeWidth={2.5}
              fill="transparent"
              dot={{ r: 4, fill: '#fff', stroke: ORANGE, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <Legend
        items={[
          { label: 'Screenings', color: PURPLE },
          { label: 'Referrals', color: ORANGE },
        ]}
      />
    </div>
  )
}

export function ClinicLoadChart() {
  return (
    <div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={clinicLoad}
            layout="vertical"
            margin={{ top: 0, right: 8, left: -10, bottom: 0 }}
            barCategoryGap={10}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="clinic"
              tickLine={false}
              axisLine={false}
              tick={{ fill: AXIS, fontSize: 11 }}
              width={50}
            />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f5f3ff' }} />
            <Bar dataKey="normal" name="Normal" stackId="a" fill={LAVENDER} radius={[8, 0, 0, 8]} />
            <Bar dataKey="referred" name="Referred" stackId="a" fill={PURPLE} />
            <Bar dataKey="pending" name="Pending" stackId="a" fill={ORANGE} radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legend
        items={[
          { label: 'Normal', color: LAVENDER },
          { label: 'Referred', color: PURPLE },
          { label: 'Pending', color: ORANGE },
        ]}
      />
    </div>
  )
}

export function WeeklyChart() {
  return (
    <div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={weeklyScreenings} margin={{ top: 6, right: 4, left: -24, bottom: 0 }} barGap={3}>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 11 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: AXIS, fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f5f3ff' }} />
            <Bar dataKey="screenings" name="Screenings" fill={ORANGE} radius={[4, 4, 0, 0]} barSize={10} />
            <Bar dataKey="referrals" name="Referrals" fill={PEACH} radius={[4, 4, 0, 0]} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legend
        items={[
          { label: 'Screenings', color: ORANGE },
          { label: 'Referrals', color: PEACH },
        ]}
      />
    </div>
  )
}

export function OutcomeDonut() {
  const colors = [ORANGE, PURPLE]
  return (
    <div className="relative mx-auto h-48 w-48">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={outcomeSplit}
            dataKey="value"
            nameKey="name"
            innerRadius={52}
            outerRadius={88}
            startAngle={90}
            endAngle={-270}
            stroke="#fff"
            strokeWidth={3}
          >
            {outcomeSplit.map((entry, i) => (
              <Cell key={entry.name} fill={colors[i]} />
            ))}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold">70%</span>
        <span className="text-[11px] text-muted-foreground">No referral</span>
      </div>
    </div>
  )
}
