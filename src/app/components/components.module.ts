import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { GameDetailsComponent } from './game-details/game-details.component';
import { FilterDetailsComponent } from './filter-details/filter-details.component';

import { IonicModule } from '@ionic/angular';


@NgModule({
    declarations: [
        GameDetailsComponent,
        FilterDetailsComponent
    ],
    exports: [
        GameDetailsComponent,
        FilterDetailsComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        RouterModule
    ]
})
export class ComponentsModule { }