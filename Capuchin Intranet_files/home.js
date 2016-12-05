

var Page = new Class({
	friarSelected: false,
	fraternitySelected: false,
	initialize: function () {
		window.addEvent('domready', this.load.bindWithEvent(this));
	},
	load: function () {
		$('FindFriarTextBox').addEvent('keypress', this.onFindTextBoxKeyPress.bindWithEvent(this));
		$('FindFraternityTextBox').addEvent('keypress', this.onFindTextBoxKeyPress.bindWithEvent(this));
		$('FindFriarButton').addEvent('click', this.onFindButtonClick.bindWithEvent(this));
		$('FindFraternityButton').addEvent('click', this.onFindButtonClick.bindWithEvent(this));

		var friarAutoComplete = new Meio.Autocomplete('FindFriarTextBox', friarsAutoCompleteValues, { delay: 0, minChars: 0, cacheType: 'own', onSelect: this.onAutoCompleteItemSelected.bindWithEvent(this), filter: { path: 'text'} });
		new Meio.Autocomplete('FindFraternityTextBox', fraternitiesAutoCompleteValues, { delay: 0, minChars: 0, cacheType: 'own', filter: { path: 'text'} });

		$('FindFriarTextBox').blur();
		$('FindFraternityTextBox').blur();
	},
	onFindButtonClick: function (e) {
		if ($(e.target).get('id').indexOf('Friar') > -1)
			this.goToFriarDetailPage($('FindFriarTextBox').get('value'));
		else if ($(e.target).get('id').indexOf('Fraternity') > -1)
			this.goToFraternityDetailPage($('FindFraternityTextBox').get('value'));
	},
	onAutoCompleteItemSelected: function (elements, value) {
		if (elements.field.node.id == 'FindFriarTextBox')
			this.friarSelected = true;
		else if (elements.field.node.id == 'FindFraternityTextBox')
			this.fraternitySelected = true;
	},
	onFindTextBoxKeyPress: function (e) {
		if (e.key == 'enter') {
			if ($(e.target).get('id').indexOf('Friar') > -1 && this.friarSelected)
				this.goToFriarDetailPage($(e.target).get('value'));
			else if ($(e.target).get('id').indexOf('Fraternity') > -1 && this.fraternitySelected)
				this.goToFraternityDetailPage($(e.target).get('value'));
		}
	},
	goToFriarDetailPage: function (name) {
		var notFound = true;
		friarsAutoCompleteValues.each(function (item) {
			if (item['text'] == name.trim()) {
				notFound = false;
				document.location.href = '/sourcebook/friar-directory/' + item['id'];
			}
		});
		if (notFound) alert("Friar's name not found. Please select a friar's name from the autocomplete drop down list below the 'Find a Friar' textbox.");
	},
	goToFraternityDetailPage: function (name) {
		var notFound = true;
		fraternitiesAutoCompleteValues.each(function (item) {
			if (item['text'] == name.trim()) {
				notFound = false;
				document.location.href = '/sourcebook/fraternities/' + item['id'];
			}
		});
		if (notFound) alert("Fraternity name not found. Please select a fraternity name from the autocomplete drop down list below the 'Find a Fraternity' textbox.");
	}
});

new Page();




