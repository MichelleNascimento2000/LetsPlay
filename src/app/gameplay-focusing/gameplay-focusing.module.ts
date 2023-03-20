import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GameplayFocusingPageRoutingModule } from './gameplay-focusing-routing.module';

import { GameplayFocusingPage } from './gameplay-focusing.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        GameplayFocusingPageRoutingModule
    ],
    declarations: [GameplayFocusingPage]
})
export class GameplayFocusingPageModule { }
