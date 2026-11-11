import { Component, computed, input, linkedSignal, output } from '@angular/core';
import { LABELS } from '@core/constants/labels';
import { PosCategory, PosProduct } from '@core/models/pos-catalog';
import { PosModule } from '../../pos.module';

/** Presentacional: chips de categorías + tarjetas de productos. Emite el producto elegido. */
@Component({
  selector: 'app-product-grid',
  imports: [PosModule],
  templateUrl: './product-grid.component.html'
})
export class ProductGridComponent {

  public readonly categories = input.required<PosCategory[]>();
  public readonly productSelected = output<PosProduct>();

  public readonly labels = LABELS;
  public readonly noImage = 'assets/images/no_image.avif';

  /** Se reinicia a la primera categoría cuando cambia el catálogo. */
  public readonly selectedCategoryId = linkedSignal<PosCategory[], number | null>({
    source: this.categories,
    computation: (categories, previous) => {
      const keep = previous?.value != null && categories.some(c => c.id === previous.value);
      return keep ? previous!.value : (categories[0]?.id ?? null);
    }
  });

  public readonly products = computed(() =>
    this.categories().find(c => c.id === this.selectedCategoryId())?.products ?? []);

  public selectCategory(id: number): void {
    this.selectedCategoryId.set(id);
  }

  public select(product: PosProduct): void {
    if (product.available) {
      this.productSelected.emit(product);
    }
  }

  public imageSrc(base64: string | null): string {
    return base64 ? `data:image/*;base64,${base64}` : this.noImage;
  }
}
