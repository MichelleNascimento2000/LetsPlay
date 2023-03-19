import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GameplaysPage } from './gameplays.page';

const routes: Routes = [
	{
		path: '',
		component: GameplaysPage,
        children: [
			{
				path: 'playing-games',
				loadChildren: () => import('./playing-games/playing-games.module').then(m => m.PlayingGamesPageModule)
			}
		]
	}
];
@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class GameplaysPageRoutingModule { }
