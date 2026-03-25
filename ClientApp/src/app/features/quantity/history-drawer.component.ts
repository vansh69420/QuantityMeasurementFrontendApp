import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HistoryEntity } from './quantity.models';

@Component({
  standalone: true,
  selector: 'app-history-drawer',
  imports: [CommonModule, MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './history-drawer.component.html',
  styleUrl: './history-drawer.component.css'
})
export class HistoryDrawerComponent {
  @Input() items: HistoryEntity[] = [];
  @Input() busy = false;
  @Input() refresh!: () => void;

  skeletonRows = [1, 2, 3, 4, 5];

  onRefreshClick(): void {
    if (this.refresh) {
      this.refresh();
    }
  }

  trackByOpId(index: number, it: HistoryEntity): string {
    return it.operationId ?? String(it.id ?? index);
  }

  formatTitle(it: HistoryEntity): string {
    const mt = it.measurementType ?? '?';
    const op = it.operationType ?? '?';

    if (it.equalityResult !== undefined && it.equalityResult !== null) {
      return `Compare (MT:${mt}) → ${it.equalityResult ? 'TRUE' : 'FALSE'}`;
    }

    if (it.scalarResult !== undefined && it.scalarResult !== null) {
      return `Divide (MT:${mt}) → ${it.scalarResult}`;
    }

    if (it.resultValue !== undefined && it.resultValue !== null) {
      const u = it.resultUnitText ? ` ${it.resultUnitText}` : '';
      return `Op:${op} (MT:${mt}) → ${it.resultValue}${u}`;
    }

    return `Op:${op} (MT:${mt})`;
  }
}
