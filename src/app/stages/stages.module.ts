import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StagesPageRoutingModule } from './stages-routing.module';

import { StagesPage } from './stages.page';
import { ComponentsModule } from '../components/components.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        StagesPageRoutingModule,
        ComponentsModule
    ],
    declarations: [StagesPage]
})
export class StagesPageModule { }