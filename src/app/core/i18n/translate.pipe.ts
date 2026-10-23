import { Pipe, PipeTransform } from '@angular/core';
import { t } from './i18n';

@Pipe({ name: 't', standalone: true })
export class TranslatePipe implements PipeTransform {
  transform(text: string | null | undefined): string {
    return t(text);
  }
}
