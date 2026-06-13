import { CommonModule } from '@angular/common';
import {
  AfterContentInit,
  Component,
  ContentChildren,
  Directive,
  EventEmitter,
  Input,
  Output,
  QueryList,
  TemplateRef,
  signal,
} from '@angular/core';

@Directive({
  selector: 'ng-template[adminEditorSection]',
  standalone: true,
})
export class AdminEditorSectionDirective {
  @Input({ required: true }) sectionId = '';
  @Input({ required: true }) label = '';
  @Input() badge: string | number | null = null;

  constructor(readonly template: TemplateRef<unknown>) {}
}

@Component({
  selector: 'app-admin-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-editor.component.html',
  styleUrl: './admin-editor.component.css',
})
export class AdminEditorComponent implements AfterContentInit {
  @Input() eyebrow = 'Administración';
  @Input() title = '';
  @Input() subtitle = '';
  @Output() closeEditor = new EventEmitter<void>();

  @ContentChildren(AdminEditorSectionDirective)
  readonly sections!: QueryList<AdminEditorSectionDirective>;

  readonly activeSectionId = signal('general');

  ngAfterContentInit(): void {
    const generalSection = this.sections.find((section) => section.sectionId === 'general');
    this.activeSectionId.set(generalSection?.sectionId ?? this.sections.first?.sectionId ?? '');
  }

  selectSection(sectionId: string): void {
    this.activeSectionId.set(sectionId);
  }

  activeSection(): AdminEditorSectionDirective | undefined {
    return this.sections.find((section) => section.sectionId === this.activeSectionId());
  }
}
