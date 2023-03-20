import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GameplayFocusingPage } from './gameplay-focusing.page';

const routes: Routes = [
	{
		path: '',
		component: GameplayFocusingPage,
        children: [
			{
				path: 'play',
				loadChildren: () => import('./play/play.module').then(m => m.PlayPageModule)
			}
		]
	}
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule],
})
export class GameplayFocusingPageRoutingModule { }