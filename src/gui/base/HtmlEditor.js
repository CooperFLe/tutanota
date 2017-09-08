//@flow
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {Editor} from "./Editor.js"
import {DropDownSelector} from "./DropDownSelector"
import {lang} from "../../misc/LanguageViewModel"
import {px} from "../size"

export const Mode = {
	HTML: "html",
	WYSIWYG: "what you see is what you get",
}

export class HtmlEditor {
	_editor: Editor;
	_mode: stream<HtmlEditorModeEnum>;
	_active: boolean;
	_disabled: boolean;
	_domTextArea: HTMLTextAreaElement;
	_borderDomElement: HTMLElement;
	_showBorders: boolean;
	_minHeight: ?number;
	_placeholderId: ?string;
	view: Function;
	_placeholderDomElement: HTMLElement;
	_value: stream<string>;
	_modeSwitcher: ?DropDownSelector<HtmlEditorModeEnum>;

	constructor() {
		this._editor = new Editor(null)
		this._mode = stream(Mode.WYSIWYG)
		this._active = false
		this._disabled = false
		this._showBorders = false
		this._minHeight = null
		this._placeholderId = null
		this._value = stream("")
		this._modeSwitcher = null

		this._mode.map(v => {
			this.setValue(this._value())
		})


		let focus = () => {
			if (!this._active) {
				this._active = true
			}

			if (this._showBorders) {
				this._borderDomElement.classList.add("editor-border-active")
				this._borderDomElement.classList.remove("editor-border")
			}
		}

		let blur = () => {
			if (this._active) {
				this._active = false
			}
			if (this._mode() == Mode.WYSIWYG) {
				this._value(this._editor.getValue())
			} else {
				this._value(this._domTextArea.value)
			}

			if (this._showBorders) {
				this._borderDomElement.classList.remove("editor-border-active")
				this._borderDomElement.classList.add("editor-border")
			}
			m.redraw()
		}

		this._editor.initialized.promise.then(() => {
			this._editor.squire.setHTML(this._value())
			this._editor._domElement.onfocus = (e) => focus(e)
			this._editor._domElement.onblur = (e) => blur(e)
		})

		let getPlaceholder = (): ?VirtualElement => {
			return (!this._active && this.isEmpty()) ? m(".abs.text-ellipsis.noselect.backface_fix.z1.i.pr-s", {
						oncreate: vnode => this._placeholderDomElement = vnode.dom,
						onclick: () => this._mode() == Mode.WYSIWYG ? this._editor._domElement.focus() : this._domTextArea.focus()
					},
					(this._placeholderId ? lang.get(this._placeholderId) : "")
				) : null
		}


		this.view = () => {
			return m(".html-editor", [
				this._modeSwitcher ? m(this._modeSwitcher) : null,
				m((this._showBorders ? ".editor-border" : ""), {
					oncreate: vnode => this._borderDomElement = vnode.dom
				}, [
					getPlaceholder(),
					m(".wysiwyg", {
						style: {display: this._mode() === Mode.WYSIWYG ? '' : 'none'}
					}, m(this._editor)),
					m(".html", {
						style: {
							display: this._mode() === Mode.HTML ? '' : 'none'
						}
					}, m("textarea.input-area", {
						oncreate: vnode => this._domTextArea = vnode.dom,
						onfocus: e => focus(e),
						onblur: e => blur(e),
						oninput: e => {
							this._domTextArea.style.height = '0px';
							this._domTextArea.style.height = (this._domTextArea.scrollHeight) + 'px';
						},
						style: {
							'font-family': 'monospace',
							"min-height": this._minHeight ? px(this._minHeight) : 'initial'
						},
						disabled: this._editor._enabled
					}))])
			])
		}
	}


	setModeSwitcher(label: string|lazy<string>) {
		this._modeSwitcher = new DropDownSelector(label, null, [
			{name: lang.get("richText_label"), value: Mode.WYSIWYG},
			{name: lang.get("htmlSourceCode_label"), value: Mode.HTML}
		], this._mode).setSelectionChangedHandler(v => {
			this._mode(v)
		})
		return this
	}


	showBorders(): HtmlEditor {
		this._showBorders = true
		return this
	}

	setMinHeight(height: number): HtmlEditor {
		this._minHeight = height
		this._editor.setMinHeight(height)
		return this
	}

	setPlaceholderId(placeholderId: string): HtmlEditor {
		this._placeholderId = placeholderId
		return this
	}

	getValue(): string {
		if (this._mode() == Mode.WYSIWYG) {
			if (this._editor.squire) {
				return this._editor.squire.getHTML()
			} else {
				return this._value()
			}
		} else {
			return this._domTextArea.value
		}
	}

	setValue(html: string): HtmlEditor {
		if (this._mode() == Mode.WYSIWYG) {
			this._editor.initialized.promise.then(() => this._editor.squire.setHTML(html))
		} else if (this._domTextArea) {
			this._domTextArea.value = html
		}
		this._value(html)
		return this
	}


	isActive() {
		return this._active
	}

	isEmpty(): boolean {
		return this._value() == ""
	}


	setEnabled(enabled: boolean): HtmlEditor {
		this._editor.setEnabled(enabled)
		if (this._domTextArea) {
			this._domTextArea.disabled = !enabled
		}
		return this
	}

}