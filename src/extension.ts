import * as vscode from 'vscode';

const functionToClassCommand = 'vscode-refactor-javascript-function-to-class.convert';
const selectFunctionCommand = 'vscode-refactor-javascript-function-to-class.select';

export function activate(context: vscode.ExtensionContext) {
	const languages = ['javascript', 'typescript'];

	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(languages, new FunctionToClassCodeActionProvider(), {
			providedCodeActionKinds: FunctionToClassCodeActionProvider.providedCodeActionKinds
		}));

	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand(functionToClassCommand, (textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
			const replaceRange = getRangeOfFunction(textEditor, edit);
			if (!replaceRange) {
				return;
			}
			edit.replace(replaceRange, 'class Test {\n}');
		})
	);
}

function getRangeOfFunction(textEditor: vscode.TextEditor, edit: vscode.TextEditorEdit): vscode.Range | undefined {
	const document = textEditor.document;
	const wordRange = document.getWordRangeAtPosition(textEditor.selection.start);
	if (!wordRange) {
		return;
	}

	const fullText = document.getText();
	const origFunctionSource = getFunctionText(fullText.substring(document.offsetAt(wordRange.start)));
	const endPosition = document.positionAt(document.offsetAt(wordRange.start) + origFunctionSource.length);
	const replaceRange = new vscode.Range(wordRange.start, endPosition);
	return textEditor.document.validateRange(replaceRange);
}

function isFunctionKeyword(document: vscode.TextDocument, range: vscode.Range | vscode.Selection): boolean {
	const wordRange = document.getWordRangeAtPosition(range.start);
	return !!wordRange && document.getText(wordRange) === 'function';
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

function getFunctionText(source: string): string {
	// This is a VERY simple scanner just to find ending curly braces
	const stack: string[] = []; // For strings and braces only

	for (let index = 0; index < source.length; index++) {
		const char = source[index];
		if (index > 0 && source[index - 1] === '\\') {
			continue;
		}

		let insideString = false;
		switch (char) {
			case '"':
			case "'":
			case '`':
				if (char === stack[stack.length - 1]) {
					stack.pop();
					insideString = false;
				} else {
					stack.push(char);
					insideString = true;
				}
				break;
			case '{':
				if (!insideString) {
					stack.push(char);
				}
				break;
			case '}':
				if (!insideString) {
					if (stack[stack.length - 1] === '{') {
						stack.pop();
						if (stack.length === 0) {
							return source.substr(0, index + 1);
						}
					}
				}
				break;
			case '/':
				if (!insideString) {
					const nextChar = source[index + 1];
					if (nextChar === '/') {
						const newLineIndex = source.indexOf('\n', index + 2);
						index = newLineIndex > index ? newLineIndex - 1 : source.length;
					} else if (nextChar === '*') {
						const endCommentIndex = source.indexOf('*/', index + 2);
						index = endCommentIndex > index ? endCommentIndex : source.length;
					} else {
						debugger;
					}
				}
				break;
			default:
				break;
		}
	}

	return source;
}

class FunctionToClassCodeActionProvider implements vscode.CodeActionProvider {
	public static readonly providedCodeActionKinds = [
		vscode.CodeActionKind.RefactorRewrite,//.append('function')
		vscode.CodeActionKind.QuickFix,
	];

	provideCodeActions(
		document: vscode.TextDocument,
		range: vscode.Range | vscode.Selection
	): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> | undefined {
		// if (!isFunctionKeywordWithCapitalizedName(document, range)) {
		// 	return;
		// }

		const actions: vscode.CodeAction[] = [];
		if (isFunctionKeyword(document, range)) {
			// const action = new vscode.CodeAction('Select entire function', vscode.CodeActionKind.RefactorRewrite);
			// action.command = { title: '', command: selectFunctionCommand };
			// actions.push(action);

			if (isFunctionKeywordWithCapitalizedName(document, range)) {
				const action = new vscode.CodeAction('Convert function to class', vscode.CodeActionKind.RefactorRewrite);
				action.command = { title: '', command: functionToClassCommand };
				actions.push(action);
			}
		}

		return actions;
	}
}

// this method is called when your extension is deactivated
export function deactivate() {
}
