'use client'

import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useEffect, useRef, useMemo } from "react";

interface NoteDisplayProps {
  notes: string[];
  currentNoteIndex: number | null;
}

interface NoteGroup {
  note: string;
  count: number;
  startIndex: number;
}

export default function NoteDisplay({ notes, currentNoteIndex }: NoteDisplayProps) {
  const noteRefs = useRef<(HTMLSpanElement | null)[]>([]);
  
  const groupedNotes: NoteGroup[] = useMemo(() => {
    if (!notes || notes.length === 0) {
      return [];
    }
    const groups: NoteGroup[] = [];
    let currentGroup: NoteGroup | null = null;

    for (let i = 0; i < notes.length; i++) {
        if (currentGroup && notes[i] === currentGroup.note) {
            currentGroup.count++;
        } else {
            if (currentGroup) {
                groups.push(currentGroup);
            }
            currentGroup = { note: notes[i], count: 1, startIndex: i };
        }
    }
    if (currentGroup) {
        groups.push(currentGroup);
    }
    return groups;
  }, [notes]);

  const currentGroupIndex = useMemo(() => {
    if (currentNoteIndex === null) return -1;
    return groupedNotes.findIndex(g => currentNoteIndex >= g.startIndex && currentNoteIndex < g.startIndex + g.count);
  }, [currentNoteIndex, groupedNotes]);

  useEffect(() => {
    if (currentGroupIndex > -1 && noteRefs.current[currentGroupIndex]) {
      noteRefs.current[currentGroupIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentGroupIndex]);


  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-lg border">
      <div className="flex w-max space-x-2 p-4">
        {groupedNotes.map((group, index) => {
          const isCurrent = index === currentGroupIndex;
          return (
            <span
              key={index}
              ref={el => { noteRefs.current[index] = el }}
              className={cn(
                "flex items-baseline gap-1 px-3 py-1 rounded-md text-sm font-mono transition-colors duration-150",
                isCurrent
                  ? "bg-accent text-accent-foreground shadow-md"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <span>{group.note}</span>
              {group.count > 1 && (
                  <span className="text-xs font-normal opacity-70">(x{group.count})</span>
              )}
            </span>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}
