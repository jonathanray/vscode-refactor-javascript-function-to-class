import * as vscode from 'vscode';
import * as client from 'vscode-languageclient';
import * as converter from 'convert-javascript-function-to-class';

const functionToClassCommand = 'vscode-refactor-javascript-function-to-class.convert';

export function activate(context: vscode.ExtensionContext) {
	const languages = ['javascript', 'typescript'];

	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(languages, new FunctionToClassCodeActionProvider(), {
			providedCodeActionKinds: FunctionToClassCodeActionProvider.providedCodeActionKinds
		}));

	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand(functionToClassCommand, (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
			try {
				const annotateTypes = textEditor.document.languageId === 'typescript';
				const input = textEditor.document.getText(textEditor.selection);
				const output = converter.convertFunctionToClass(input, annotateTypes);
				edit.replace(textEditor.selection, output);
			} catch (error) {
				vscode.window.showErrorMessage('Failed to convert function to class');
			}
		})
	);
}

function isFunctionKeywordWithCapitalizedName(document: vscode.TextDocument, range: vscode.Range | vscode.Selection): boolean {
	const wordRange = document.getWordRangeAtPosition(range.start);
	if (!wordRange || document.getText(wordRange) !== 'function') {
		return false;
	}

	const lineText = document.lineAt(wordRange.start.line).text;
	const firstCharOfFunctionName = lineText.substr(wordRange.end.character).trimLeft()[0];
	return firstCharOfFunctionName !== firstCharOfFunctionName.toLocaleLowerCase();
}

class FunctionToClassCodeActionProvider implements vscode.CodeActionProvider {
	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.RefactorRewrite,
		vscode.CodeActionKind.QuickFix,
	];

	provideCodeActions(
		document: vscode.TextDocument,
		range: vscode.Range | vscode.Selection
	): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> | undefined {
		const actions: vscode.CodeAction[] = [];

		if (isFunctionKeywordWithCapitalizedName(document, range)) {
			const action = new vscode.CodeAction('Convert function to class', vscode.CodeActionKind.RefactorRewrite);
			action.command = { title: '', command: functionToClassCommand };
			actions.push(action);
		}

		return actions;
	}
}

// this method is called when your extension is deactivated
export function deactivate() {
}
