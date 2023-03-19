import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PlayingGamesPage } from './playing-games.page';

const routes: Routes = [
    {
        path: '',
        component: PlayingGamesPage
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PlayingGamesPageRoutingModule { }
