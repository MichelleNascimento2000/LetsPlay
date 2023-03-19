import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { GameplaysPageRoutingModule } from './gameplays-routing.module';

import { GameplaysPage } from './gameplays.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        GameplaysPageRoutingModule
    ],
    declarations: [GameplaysPage]
})
export class GameplaysPageModule { }
