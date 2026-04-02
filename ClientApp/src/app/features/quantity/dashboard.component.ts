import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../core/auth.service';
import { QuantityService } from './quantity.service';
import { HistoryEntity, MeasurementType, QuantityDtoResponse, ArithmeticOp, ActionKey } from './quantity.models';
import { HistoryDrawerComponent } from './history-drawer.component';

type UnitOption = { value: string; label: string };

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    MatCardModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    HistoryDrawerComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  readonly MeasurementType = MeasurementType;

  measurementType: MeasurementType = MeasurementType.Length;
  action: ActionKey = 'comparison';
  op: ArithmeticOp = 'add';

  units: UnitOption[] = [];
  busy = false;

  history: HistoryEntity[] = [];
  historyBusy = false;

  resultText = '-';
  errorText: string | null = null;

  userLabel = 'User';
  isAdmin = false;

  form = this.fb.group({
    leftValue: [1, [Validators.required]],
    rightValue: [1, [Validators.required]],
    leftUnit: ['feet', [Validators.required]],
    rightUnit: ['inch', [Validators.required]],
    targetUnit: ['feet', [Validators.required]]
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private qty: QuantityService,
    private router: Router,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    const user = this.auth.getUser();
    if (user) {
      this.userLabel = `${user.username} (${user.role})`;
      this.isAdmin = user.role.toLowerCase() === 'admin';
    }

    this.setUnitsForType();
    this.refreshHistory();
  }

  refreshHistory = async (): Promise<void> => {
    this.historyBusy = true;
    try {
      const items = await this.qty.getHistory();
      this.history = (items ?? []).slice(0, 100);
    } catch {
      this.history = [];
    } finally {
      this.historyBusy = false;
    }
  };

  setType(type: MeasurementType): void {
    this.measurementType = type;

    if (this.measurementType === MeasurementType.Temperature && this.action === 'arithmetic') {
      this.action = 'conversion';
      this.snack.open('Arithmetic is disabled for Temperature.', 'OK', { duration: 2000 });
    }

    this.setUnitsForType();
    this.resetResult();
  }

  setAction(action: ActionKey): void {
    this.action = action;

    if (this.measurementType === MeasurementType.Temperature && action === 'arithmetic') {
      this.action = 'conversion';
      this.snack.open('Arithmetic is disabled for Temperature.', 'OK', { duration: 2000 });
    }

    this.resetResult();
  }

  setOp(op: ArithmeticOp): void {
    this.op = op;
    this.resetResult();
  }

  swapConversion(): void {
    const fromUnit = this.form.controls.leftUnit.value ?? '';
    const toUnit = this.form.controls.targetUnit.value ?? '';

    this.form.controls.leftUnit.setValue(toUnit);
    this.form.controls.targetUnit.setValue(fromUnit);
    this.resetResult();
  }

  swapArithmetic(): void {
    const lv = this.form.controls.leftValue.value;
    const lu = this.form.controls.leftUnit.value;

    const rv = this.form.controls.rightValue.value;
    const ru = this.form.controls.rightUnit.value;

    this.form.controls.leftValue.setValue(rv);
    this.form.controls.leftUnit.setValue(ru);

    this.form.controls.rightValue.setValue(lv);
    this.form.controls.rightUnit.setValue(lu);

    this.resetResult();
  }

  async calculate(): Promise<void> {
    if (this.form.invalid) {
      this.snack.open('Please fill all required fields.', 'OK', { duration: 2000 });
      return;
    }

    this.busy = true;
    this.errorText = null;

    try {
      const payload = this.buildPayload();
      let res: QuantityDtoResponse;

      if (this.action === 'comparison') {
        res = await this.qty.compare(payload);
      } else if (this.action === 'conversion') {
        res = await this.qty.convert(payload);
      } else {
        if (this.op === 'add') {
          res = await this.qty.add(payload);
        } else if (this.op === 'subtract') {
          res = await this.qty.subtract(payload);
        } else {
          res = await this.qty.divide(payload);
        }
      }

      this.applyResult(res);
      await this.refreshHistory();
    } catch (e: any) {
      const msg = e?.error ?? e?.error?.message ?? 'Request failed.';
      this.errorText = String(msg);
      this.resultText = 'Error';
    } finally {
      this.busy = false;
    }
  }

  goToAdmin(): void {
    this.router.navigateByUrl('/admin');
  }

  async logout(): Promise<void> {
  await this.auth.logout();
  await this.router.navigateByUrl('/login');
}

  private resetResult(): void {
    this.resultText = '-';
    this.errorText = null;
  }

  private applyResult(res: QuantityDtoResponse): void {
    if (res?.hasError) {
      this.resultText = 'Error';
      this.errorText = res.errorMessage ?? 'Operation failed.';
      return;
    }

    this.errorText = null;

    if (res.equalityResult !== undefined && res.equalityResult !== null) {
      this.resultText = res.equalityResult ? 'TRUE' : 'FALSE';
      return;
    }

    if (res.scalarResult !== undefined && res.scalarResult !== null) {
      this.resultText = String(res.scalarResult);
      return;
    }

    if (res.resultValue !== undefined && res.resultValue !== null) {
      const unit = res.resultUnitText ? ` ${res.resultUnitText}` : '';
      this.resultText = `${res.resultValue}${unit}`;
      return;
    }

    this.resultText = '-';
  }

  private buildPayload(): any {
    const mt = this.measurementType;

    const leftValue = Number(this.form.controls.leftValue.value);
    const rightValue = Number(this.form.controls.rightValue.value);

    const leftUnit = this.form.controls.leftUnit.value ?? '';
    const rightUnit = this.form.controls.rightUnit.value ?? '';
    const targetUnit = this.form.controls.targetUnit.value ?? '';

    if (this.action === 'comparison') {
      return {
        firstQuantityDto: { measurementType: mt, firstValue: leftValue, firstUnitText: leftUnit },
        secondQuantityDto: { measurementType: mt, firstValue: rightValue, firstUnitText: rightUnit }
      };
    }

    if (this.action === 'conversion') {
      return {
        quantityDto: { measurementType: mt, firstValue: leftValue, firstUnitText: leftUnit },
        targetUnitText: targetUnit
      };
    }

    const base = {
      firstQuantityDto: { measurementType: mt, firstValue: leftValue, firstUnitText: leftUnit },
      secondQuantityDto: { measurementType: mt, firstValue: rightValue, firstUnitText: rightUnit }
    };

    if (this.op === 'divide') {
      return base;
    }

    return { ...base, targetUnitText: targetUnit };
  }

  private setUnitsForType(): void {
    this.units = getUnits(this.measurementType);

    if (this.measurementType === MeasurementType.Length) {
      this.form.controls.leftUnit.setValue('feet');
      this.form.controls.rightUnit.setValue('inch');
      this.form.controls.targetUnit.setValue('feet');
    } else if (this.measurementType === MeasurementType.Weight) {
      this.form.controls.leftUnit.setValue('kg');
      this.form.controls.rightUnit.setValue('g');
      this.form.controls.targetUnit.setValue('kg');
    } else if (this.measurementType === MeasurementType.Volume) {
      this.form.controls.leftUnit.setValue('litre');
      this.form.controls.rightUnit.setValue('millilitre');
      this.form.controls.targetUnit.setValue('litre');
    } else {
      this.form.controls.leftUnit.setValue('celsius');
      this.form.controls.rightUnit.setValue('fahrenheit');
      this.form.controls.targetUnit.setValue('celsius');
    }
  }
}

function getUnits(type: MeasurementType): UnitOption[] {
  if (type === MeasurementType.Length) {
    return [
      { value: 'feet', label: 'Feet' },
      { value: 'inch', label: 'Inch' },
      { value: 'yard', label: 'Yard' },
      { value: 'centimeter', label: 'Centimeter' }
    ];
  }

  if (type === MeasurementType.Weight) {
    return [
      { value: 'kg', label: 'Kilogram (kg)' },
      { value: 'g', label: 'Gram (g)' },
      { value: 'pound', label: 'Pound' }
    ];
  }

  if (type === MeasurementType.Volume) {
    return [
      { value: 'litre', label: 'Litre' },
      { value: 'millilitre', label: 'Millilitre' },
      { value: 'gallon', label: 'Gallon' }
    ];
  }

  return [
    { value: 'celsius', label: 'Celsius' },
    { value: 'fahrenheit', label: 'Fahrenheit' },
    { value: 'kelvin', label: 'Kelvin' }
  ];
}
