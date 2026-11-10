import { NgModule } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { SkeletonModule } from 'primeng/skeleton';
import { ToastModule } from 'primeng/toast';
import { ChipModule } from 'primeng/chip';
import { MenubarModule } from 'primeng/menubar';
import { TextareaModule } from 'primeng/textarea';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ToolbarModule } from 'primeng/toolbar';
import { BadgeModule } from 'primeng/badge';
import { FieldsetModule } from 'primeng/fieldset';
import { ColorPickerModule } from 'primeng/colorpicker';
import { PickListModule } from 'primeng/picklist';
import { FileUploadModule } from 'primeng/fileupload';
import { SliderModule } from 'primeng/slider';
import { ButtonModule } from 'primeng/button';
import { StepsModule } from 'primeng/steps';
import { CardModule } from 'primeng/card';
import { PasswordModule } from 'primeng/password';
import { ListboxModule } from 'primeng/listbox';
import { TimelineModule } from 'primeng/timeline';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { AccordionModule } from 'primeng/accordion';
import { SplitterModule } from 'primeng/splitter';
import { AutoFocusModule } from 'primeng/autofocus';
import { FocusTrapModule } from 'primeng/focustrap';
import { DragDropModule } from 'primeng/dragdrop';
import { MenuModule } from 'primeng/menu';
import { DatePickerModule } from 'primeng/datepicker';
import { SpeedDialModule } from 'primeng/speeddial';
import { MultiSelectModule } from 'primeng/multiselect';
import { RatingModule } from 'primeng/rating';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { SelectModule } from 'primeng/select';
import { FloatLabel } from "primeng/floatlabel"
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { TabsModule } from 'primeng/tabs';
import { StepperModule } from 'primeng/stepper';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { OverlayBadgeModule } from 'primeng/overlaybadge';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { IftaLabelModule } from 'primeng/iftalabel';
import { PopoverModule } from 'primeng/popover';
import { ImageModule } from 'primeng/image';
import { TagModule } from 'primeng/tag';

@NgModule({
  imports: [
    FloatLabel
  ],
  exports: [
    ToastModule,
    StepperModule,
    DatePickerModule,
    FloatLabel,
    ToggleSwitchModule,
    InputTextModule,
    ButtonModule,
    IconFieldModule,
    ScrollPanelModule,
    InputIconModule,
    SkeletonModule,
    CheckboxModule,
    SplitButtonModule,
    MenubarModule,
    FieldsetModule,
    TextareaModule,
    TableModule,
    ChipModule,
    ToolbarModule,
    DialogModule,
    BadgeModule,
    ColorPickerModule,
    PickListModule,
    FileUploadModule,
    SliderModule,
    InputNumberModule,
    StepsModule,
    CardModule,
    PasswordModule,
    ListboxModule,
    TimelineModule,
    ToggleButtonModule,
    AccordionModule,
    SplitterModule,
    AutoFocusModule,
    AutoCompleteModule,
    FocusTrapModule,
    DragDropModule,
    MenuModule,
    SpeedDialModule,
    OverlayBadgeModule,
    MultiSelectModule,
    TabsModule,
    RatingModule,
    SelectButtonModule,
    TooltipModule,
    SelectModule,
    ConfirmDialogModule,
    IftaLabelModule,
    PopoverModule,
    ImageModule,
    TagModule
  ]
})
export class PrimeModules { }
