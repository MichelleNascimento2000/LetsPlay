import { Component, Input, OnInit } from '@angular/core';
import { GameplayStage, HistoryType } from 'src/app/models/API-Models';
import { DatabaseService } from 'src/app/services/database.service';
import { GameplaysService } from 'src/app/services/gameplays.service';

@Component({
	selector: 'app-stage-details',
	templateUrl: './stage-details.component.html',
	styleUrls: ['./stage-details.component.scss'],
})
export class StageDetailsComponent implements OnInit {

    @Input() stage_to_show: GameplayStage;

	constructor(
		public gameplaysService: GameplaysService,
		public databaseService: DatabaseService
	){}

	ngOnInit(){

        //  Inicializa variáveis locais referentes ao nome e descrição da fase atual
		this.insertedName        = this.stage_to_show.name;
		this.insertedDescription = this.stage_to_show.description;
	}

    //  Variáveis locais para validar alteração no nome e descrição da fase
	public insertedName       : string;
	public insertedDescription: string;

    //  Salvar modificações da fase (exceto a de status, que ocorre pontualmente)
    public saveStage(): boolean {
        if(!this.isNameDescriptionDataValid()){
            return false;
        }

        //  Se o nome da fase mudou, criar item de histórico para registrar
        //  Não é criad para a descrição pois é um campo de tamanho maior e prejudica a visualização no histórico
        if(this.didTitleChanged()){
            this.gameplaysService.createHistoryItem(this.stage_to_show.gameplay, HistoryType.TituloStage, this.stage_to_show.name, this.insertedName, null);
        }

        //  Caso os inputs sejam válidos, atribui à fase os valores inseridos para nome e descrição
        this.stage_to_show.name        = this.insertedName;
        this.stage_to_show.description = this.insertedDescription;

        //  Atualiza data da última modificação da fase
        this.gameplaysService.updateStageLastModifiedDate(this.stage_to_show);

        //  Salva gameplays no Storage
        this.gameplaysService.saveGameplaysToStorage();

        //  Exibe mensagem de sucesso
        this.databaseService.showSuccessErrorToast(true, 'Salvo!');
    }

    //  Verifica se o nome e a descrição inseridos não são vazios 
	public isNameDescriptionDataValid(): boolean {
		if(!Boolean(this.insertedName) || !Boolean(this.insertedDescription)){
			this.databaseService.showSuccessErrorToast(false, 'O nome e descrição precisam estar preenchidos!');
			return false;
		}
		return true;
	}

    //  Indica se o nome ou descrição sofreu alguma modificação, a fim de ativar o botão de salvamento
	public areInputsDifferent(): boolean {
		return this.didTitleChanged() || this.didDescriptionChanged();
	}

    //  Indica se o nome da fase mudou
	public didTitleChanged(): boolean {
		return this.stage_to_show.name != this.insertedName;
	}

    //  Indica se a descrição da fase mudou
    public didDescriptionChanged(): boolean {
		return this.stage_to_show.description != this.insertedDescription;
	}
}