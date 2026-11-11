import { DISCOUNT_TYPE } from '@core/enums/discount-type';
import { CurrencyBsPipe } from '@core/pipes/currency-bs.pipe';
import { previewDiscountAmount, round2 } from './money';

describe('money (vista previa)', () => {

  it('round2 redondea HALF_UP sin errores de coma flotante', () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2(5.625)).toBe(5.63);
    expect(round2(2.675)).toBe(2.68);
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(-1.005)).toBe(-1.01);
  });

  it('previewDiscountAmount calcula porcentaje y monto fijo como el backend', () => {
    expect(previewDiscountAmount(45, DISCOUNT_TYPE.PERCENTAGE, 12.5)).toBe(5.63);
    expect(previewDiscountAmount(30, DISCOUNT_TYPE.FIXED_AMOUNT, 5)).toBe(5);
  });

  it('previewDiscountAmount nunca supera el subtotal ni aplica valores vacíos', () => {
    expect(previewDiscountAmount(10, DISCOUNT_TYPE.FIXED_AMOUNT, 25)).toBe(10);
    expect(previewDiscountAmount(10, null, 5)).toBe(0);
    expect(previewDiscountAmount(10, DISCOUNT_TYPE.PERCENTAGE, null)).toBe(0);
    expect(previewDiscountAmount(0, DISCOUNT_TYPE.PERCENTAGE, 10)).toBe(0);
  });

  it('currencyBs formatea en bolivianos', () => {
    const pipe = new CurrencyBsPipe();
    expect(pipe.transform(1234.5)).toMatch(/^Bs 1\.?234,50$/);
    expect(pipe.transform(0)).toBe('Bs 0,00');
    expect(pipe.transform(null)).toBe('');
  });
});
