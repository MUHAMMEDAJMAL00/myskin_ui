import { Pipe, PipeTransform } from '@angular/core';
import { resolveImageUrl } from '../../core/utils/image.util';

@Pipe({
  standalone: false, name: 'imageUrl' })
export class ImageUrlPipe implements PipeTransform {
  transform(imageUrl: string | null | undefined): string {
    return resolveImageUrl(imageUrl);
  }
}
