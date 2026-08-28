"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

export type PlannerEvent = {
  id: string;
  title: string;
  date: string;
  start?: string;
  end?: string;
  color: string;
  category: string;
  status?: string;
  meta?: string;
};

type PlannerProps = {
  title: string;
  events: PlannerEvent[];
  onCreate?: () => void;
  onSelect?: (event: PlannerEvent) => void;
};

const hours = Array.from({ length: 14 }, (_, index) => index + 7);
const dayLabel = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
});
const monthLabel = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}
function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}
function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  next.setDate(next.getDate() - (day === 0 ? 6 : day - 1));
  return next;
}
function minutes(value = "09:00") {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function PlannerCalendar({
  title,
  events,
  onCreate,
  onSelect,
}: PlannerProps) {
  const [cursor, setCursor] = useState(() => new Date());
  const [mode, setMode] = useState<"1 dia" | "3 dias" | "Semana">("Semana");
  const [search, setSearch] = useState("");
  const categories = useMemo(
    () => [...new Set(events.map((event) => event.category))],
    [events],
  );
  const [hidden, setHidden] = useState<string[]>([]);
  const rangeStart = mode === "Semana" ? startOfWeek(cursor) : cursor;
  const dayCount = mode === "1 dia" ? 1 : mode === "3 dias" ? 3 : 7;
  const days = Array.from({ length: dayCount }, (_, index) =>
    addDays(rangeStart, index),
  );
  const visibleEvents = events.filter(
    (event) =>
      !hidden.includes(event.category) &&
      event.title.toLowerCase().includes(search.toLowerCase()),
  );
  const miniStart = startOfWeek(
    new Date(cursor.getFullYear(), cursor.getMonth(), 1),
  );
  const miniDays = Array.from({ length: 42 }, (_, index) =>
    addDays(miniStart, index),
  );
  function move(direction: number) {
    setCursor(addDays(cursor, direction * dayCount));
  }

  return (
    <section className="planner-shell">
      <aside className="planner-sidebar">
        <div className="planner-mini-head">
          <strong>{monthLabel.format(cursor)}</strong>
          <div>
            <button
              onClick={() =>
                setCursor(
                  new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1),
                )
              }
            >
              <ChevronLeft />
            </button>
            <button
              onClick={() =>
                setCursor(
                  new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1),
                )
              }
            >
              <ChevronRight />
            </button>
          </div>
        </div>
        <div className="mini-weekdays">
          {["S", "T", "Q", "Q", "S", "S", "D"].map((day, index) => (
            <span key={`${day}-${index}`}>{day}</span>
          ))}
        </div>
        <div className="mini-month">
          {miniDays.map((day) => (
            <button
              key={iso(day)}
              className={`${day.getMonth() !== cursor.getMonth() ? "muted" : ""} ${iso(day) === iso(cursor) ? "selected" : ""} ${iso(day) === iso(new Date()) ? "today" : ""}`}
              onClick={() => setCursor(day)}
            >
              {day.getDate()}
            </button>
          ))}
        </div>
        <div className="planner-calendars">
          <div className="planner-side-title">
            <Filter /> Calendários
          </div>
          {categories.map((category, index) => (
            <label key={category}>
              <Checkbox
                checked={!hidden.includes(category)}
                onCheckedChange={(checked) =>
                  setHidden(
                    checked
                      ? hidden.filter((item) => item !== category)
                      : [...hidden, category],
                  )
                }
              />
              <i
                style={{
                  background: [
                    "#2563eb",
                    "#8b5cf6",
                    "#e67e22",
                    "#16a34a",
                    "#dc2626",
                  ][index % 5],
                }}
              />
              {category}
            </label>
          ))}
        </div>
      </aside>
      <div className="planner-main">
        <header className="planner-toolbar">
          <div>
            <CalendarDays />
            <strong>{title}</strong>
          </div>
          <div className="planner-search">
            <Search />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar evento"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCursor(new Date())}
          >
            Hoje
          </Button>
          <div className="planner-arrows">
            <Button variant="ghost" size="icon" onClick={() => move(-1)}>
              <ChevronLeft />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => move(1)}>
              <ChevronRight />
            </Button>
          </div>
          <strong className="planner-range">{monthLabel.format(cursor)}</strong>
          <NativeSelect
            value={mode}
            onChange={(event) => setMode(event.target.value as typeof mode)}
          >
            {["1 dia", "3 dias", "Semana"].map((value) => (
              <NativeSelectOption key={value}>{value}</NativeSelectOption>
            ))}
          </NativeSelect>
          {onCreate && (
            <Button size="sm" onClick={onCreate}>
              <Plus /> Novo
            </Button>
          )}
        </header>
        <div
          className="planner-grid"
          style={{ ["--planner-days" as string]: dayCount }}
        >
          <div className="planner-corner">GMT-3</div>
          {days.map((day) => (
            <div
              className={`planner-day-head ${iso(day) === iso(new Date()) ? "active" : ""}`}
              key={iso(day)}
            >
              <span>{dayLabel.format(day).replace(".", "")}</span>
            </div>
          ))}
          <div className="planner-hours">
            {hours.map((hour) => (
              <span key={hour}>{String(hour).padStart(2, "0")}:00</span>
            ))}
          </div>
          {days.map((day) => (
            <div className="planner-day-column" key={iso(day)}>
              {hours.map((hour) => (
                <i
                  className="planner-hour-line"
                  style={{ top: (hour - 7) * 64 }}
                  key={hour}
                />
              ))}
              {visibleEvents
                .filter((event) => event.date === iso(day))
                .map((event) => {
                  const top =
                    (Math.max(0, minutes(event.start) - 7 * 60) / 60) * 64;
                  const height = Math.max(
                    34,
                    ((minutes(event.end || event.start) -
                      minutes(event.start)) /
                      60) *
                      64 || 42,
                  );
                  return (
                    <button
                      className="planner-event"
                      key={event.id}
                      style={{
                        top,
                        height,
                        borderColor: event.color,
                        background: `${event.color}18`,
                        color: event.color,
                      }}
                      onClick={() => onSelect?.(event)}
                    >
                      <strong>{event.title}</strong>
                      <span>
                        {event.start || "Dia todo"}
                        {event.end ? ` – ${event.end}` : ""}
                      </span>
                      {event.meta && <small>{event.meta}</small>}
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
