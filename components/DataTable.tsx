import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface DataTableColumn<T> { key: keyof T; label: string; width?: number; render?: (value: T[keyof T], row: T) => React.ReactNode; }

interface DataTableProps<T extends Record<string, unknown>> { data: T[]; columns: DataTableColumn<T>[]; onRowPress?: (row: T) => void; emptyText?: string; }

type SortDir = 'asc' | 'desc';

export function DataTable<T extends Record<string, unknown>>({ data, columns, onRowPress, emptyText = 'No data' }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const sorted = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      const cmp = String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);
  const handleSort = (key: keyof T) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View>
        <View style={styles.headerRow}>
          {columns.map(col => (
            <TouchableOpacity key={String(col.key)} accessibilityRole="button" style={[styles.cell, col.width ? { width: col.width } : styles.cellFlex]} onPress={() => handleSort(col.key)}>
              <Text style={styles.headerText}>{col.label}</Text>
              {sortKey === col.key && <Ionicons name={sortDir === 'asc' ? 'chevron-up' : 'chevron-down'} size={12} color="#6B7280" />}
            </TouchableOpacity>
          ))}
        </View>
        {sorted.length === 0 ? (
          <View style={styles.emptyRow}><Text style={styles.emptyText}>{emptyText}</Text></View>
        ) : sorted.map((row, i) => (
          <TouchableOpacity key={i} accessibilityRole="button" style={[styles.row, i % 2 === 0 && styles.rowEven]} onPress={() => onRowPress?.(row)} disabled={!onRowPress}>
            {columns.map(col => (
              <View key={String(col.key)} style={[styles.cell, col.width ? { width: col.width } : styles.cellFlex]}>
                {col.render ? <>{col.render(row[col.key], row)}</> : <Text style={styles.cellText} numberOfLines={1}>{String(row[col.key] ?? '')}</Text>}
              </View>
            ))}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', backgroundColor: '#F9FAFB', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  rowEven: { backgroundColor: '#FAFAFA' },
  cell: { paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
  cellFlex: { minWidth: 100 },
  headerText: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  cellText: { fontSize: 13, color: '#111827' },
  emptyRow: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
