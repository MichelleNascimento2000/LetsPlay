import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PlayingGamesPageRoutingModule } from './playing-games-routing.module';

import { PlayingGamesPage } from './playing-games.page';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        PlayingGamesPageRoutingModule,
        ComponentsModule
    ],
    declarations: [PlayingGamesPage]
})
export class PlayingGamesPageModule { }
