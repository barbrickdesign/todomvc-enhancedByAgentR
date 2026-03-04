(function() {
	'use strict';

	var todos = [],
		stat = {},
		currentFilter = 'all',
		ENTER_KEY = 13;

	window.addEventListener( 'load', windowLoadHandler, false );

	function Todo( title, completed, priority, dueDate ) {
		this.id = getUuid();
		this.title = title;
		this.completed = completed;
		this.priority = priority || 'medium';
		this.dueDate = dueDate || '';
	}

	function Stat() {
		this.todoLeft = 0;
		this.todoCompleted = 0;
		this.totalTodo = 0;
	}

	function windowLoadHandler() {
		loadTodos();
		readFilterFromHash();
		refreshData();
		addEventListeners();
	}

	function readFilterFromHash() {
		var hash = window.location.hash;
		if ( hash === '#/active' ) {
			currentFilter = 'active';
		} else if ( hash === '#/completed' ) {
			currentFilter = 'completed';
		} else {
			currentFilter = 'all';
		}
	}

	function addEventListeners() {
		document.getElementById('new-todo').addEventListener( 'keypress', newTodoKeyPressHandler, false );
		document.getElementById('toggle-all').addEventListener( 'change', toggleAllChangeHandler, false );
		document.getElementById('clear-completed').addEventListener( 'click', hrefClearClickHandler, false );
		window.addEventListener( 'hashchange', hashChangeHandler, false );
	}

	function hashChangeHandler() {
		readFilterFromHash();
		refreshData();
	}

	function inputEditTodoKeyPressHandler( event ) {
		var inputEditTodo = event.target,
			trimmedText = inputEditTodo.value.trim(),
			todoId = event.target.id.slice( 6 );

		if ( trimmedText ) {
			if ( event.keyCode === ENTER_KEY ) {
				editTodo( todoId, trimmedText );
			}
		} else {
			removeTodoById( todoId );
			refreshData();
		}
	}

	function inputEditTodoBlurHandler( event ) {
		var inputEditTodo = event.target,
			trimmedText = inputEditTodo.value.trim(),
			todoId = event.target.id.slice( 6 );

		if ( trimmedText ) {
			editTodo( todoId, trimmedText );
		} else {
			removeTodoById( todoId );
			refreshData();
		}
	}

	function newTodoKeyPressHandler( event ) {
		if ( event.keyCode === ENTER_KEY ) {
			var priority = document.getElementById('new-todo-priority').value;
			var dueDate = document.getElementById('new-todo-due').value;
			addTodo( document.getElementById('new-todo').value, priority, dueDate );
		}
	}

	function toggleAllChangeHandler( event ) {
		for ( var i in todos ) {
			todos[ i ].completed = event.target.checked;
		}

		refreshData();
	}

	function spanDeleteClickHandler( event ) {
		removeTodoById( event.target.getAttribute('data-todo-id') );
		refreshData();
	}

	function hrefClearClickHandler() {
		removeTodosCompleted();
		refreshData();
	}

	function todoContentHandler( event ) {
		var todoId = event.target.getAttribute('data-todo-id'),
			li = document.getElementById( 'li_' + todoId ),
			inputEditTodo = document.getElementById( 'input_' + todoId );

		li.className = ( li.className.replace( /\bcompleted\b/, '' ) + ' editing' ).trim();
		inputEditTodo.focus();
	}

	function checkboxChangeHandler( event ) {
		var checkbox = event.target,
			todo = getTodoById( checkbox.getAttribute('data-todo-id') );

		todo.completed = checkbox.checked;
		refreshData();
	}

	function loadTodos() {
		if ( !localStorage.getItem('todos-vanillajs') ) {
			localStorage.setItem( 'todos-vanillajs', JSON.stringify([]) );
		}

		todos = JSON.parse( localStorage.getItem('todos-vanillajs') );
	}

	function addTodo( text, priority, dueDate ) {
		var trimmedText = text.trim();

		if ( trimmedText ) {
			var todo = new Todo( trimmedText, false, priority, dueDate );
			todos.push( todo );
			document.getElementById('new-todo-due').value = '';
			document.getElementById('new-todo-priority').value = 'medium';
			refreshData();
		}
	}

	function editTodo( todoId, text ) {
		var i, l;

		for ( i = 0, l = todos.length; i < l; i++ ) {
			if ( todos[ i ].id === todoId ) {
				todos[ i ].title = text;
			}
		}

		refreshData();
	}

	function removeTodoById( id ) {
		var i = todos.length;

		while ( i-- ) {
			if ( todos[ i ].id === id ) {
				todos.splice( i, 1 );
			}
		}
	}

	function removeTodosCompleted() {
		var i = todos.length;

		while ( i-- ) {
			if ( todos[ i ].completed ) {
				todos.splice( i, 1 );
			}
		}
	}

	function getTodoById( id ) {
		var i, l;

		for ( i = 0, l = todos.length; i < l; i++ ) {
			if ( todos[ i ].id === id ) {
				return todos[ i ];
			}
		}
	}

	function getFilteredTodos() {
		if ( currentFilter === 'active' ) {
			return todos.filter( function( t ) { return !t.completed; } );
		} else if ( currentFilter === 'completed' ) {
			return todos.filter( function( t ) { return t.completed; } );
		}
		return todos;
	}

	function isOverdue( dueDate ) {
		if ( !dueDate ) { return false; }
		var now = new Date();
		var todayStr = now.getFullYear() + '-' +
			String( now.getMonth() + 1 ).padStart( 2, '0' ) + '-' +
			String( now.getDate() ).padStart( 2, '0' );
		return dueDate < todayStr;
	}

	function refreshData() {
		saveTodos();
		computeStats();
		redrawTodosUI();
		redrawStatsUI();
		changeToggleAllCheckboxState();
		updateFilterLinks();
	}

	function saveTodos() {
		localStorage.setItem( 'todos-vanillajs', JSON.stringify( todos ) );
	}

	function computeStats() {
		var i, l;

		stat = new Stat();
		stat.totalTodo = todos.length;

		for ( i = 0, l = todos.length; i < l; i++ ) {
			if ( todos[ i ].completed ) {
				stat.todoCompleted++;
			}
		}

		stat.todoLeft = stat.totalTodo - stat.todoCompleted;
	}

	function updateFilterLinks() {
		var links = document.querySelectorAll('#filters a');
		for ( var i = 0; i < links.length; i++ ) {
			links[ i ].className = '';
		}
		var map = { 'all': '#/', 'active': '#/active', 'completed': '#/completed' };
		var activeLink = document.querySelector( '#filters a[href="' + map[ currentFilter ] + '"]' );
		if ( activeLink ) {
			activeLink.className = 'selected';
		}
	}

	function redrawTodosUI() {
		var todo, checkbox, label, priorityBadge, dueDateSpan, deleteLink, divDisplay,
			inputEditTodo, li, i, l,
			filtered = getFilteredTodos(),
			ul = document.getElementById('todo-list');

		document.getElementById('main').style.display = todos.length ? 'block' : 'none';

		ul.innerHTML = '';
		document.getElementById('new-todo').value = '';

		for ( i = 0, l = filtered.length; i < l; i++ ) {
			todo = filtered[ i ];

			// create checkbox
			checkbox = document.createElement('input');
			checkbox.className = 'toggle';
			checkbox.setAttribute( 'data-todo-id', todo.id );
			checkbox.type = 'checkbox';
			checkbox.addEventListener( 'change', checkboxChangeHandler );

			// create priority badge
			priorityBadge = document.createElement('span');
			priorityBadge.className = 'priority-badge priority-' + ( todo.priority || 'medium' );
			priorityBadge.textContent = ( todo.priority || 'medium' ).charAt(0).toUpperCase();
			priorityBadge.title = 'Priority: ' + ( todo.priority || 'medium' );

			// create label
			label = document.createElement('label');
			label.setAttribute( 'data-todo-id', todo.id );
			label.appendChild( document.createTextNode( todo.title ) );
			label.addEventListener( 'dblclick', todoContentHandler );

			// create due date span
			if ( todo.dueDate ) {
				dueDateSpan = document.createElement('span');
				dueDateSpan.className = 'due-date' + ( isOverdue( todo.dueDate ) && !todo.completed ? ' overdue' : '' );
				dueDateSpan.textContent = todo.dueDate;
				label.appendChild( dueDateSpan );
			}

			// create delete button
			deleteLink = document.createElement('button');
			deleteLink.className = 'destroy';
			deleteLink.setAttribute( 'data-todo-id', todo.id );
			deleteLink.addEventListener( 'click', spanDeleteClickHandler );

			// create divDisplay
			divDisplay = document.createElement('div');
			divDisplay.className = 'view';
			divDisplay.setAttribute( 'data-todo-id', todo.id );
			divDisplay.appendChild( checkbox );
			divDisplay.appendChild( priorityBadge );
			divDisplay.appendChild( label );
			divDisplay.appendChild( deleteLink );

			// create todo input
			inputEditTodo = document.createElement('input');
			inputEditTodo.id = 'input_' + todo.id;
			inputEditTodo.className = 'edit';
			inputEditTodo.value = todo.title;
			inputEditTodo.addEventListener( 'keypress', inputEditTodoKeyPressHandler );
			inputEditTodo.addEventListener( 'blur', inputEditTodoBlurHandler );

			// create li
			li = document.createElement('li');
			li.id = 'li_' + todo.id;
			li.appendChild( divDisplay );
			li.appendChild( inputEditTodo );

			if ( todo.completed ) {
				li.className = 'completed';
				checkbox.checked = true;
			}

			ul.appendChild( li );
		}
	}

	function changeToggleAllCheckboxState() {
		var toggleAll = document.getElementById('toggle-all');

		toggleAll.checked = todos.length > 0 && stat.todoCompleted === todos.length;
	}

	function redrawStatsUI() {
		var footer = document.getElementById('footer');
		var todoCount = document.getElementById('todo-count');
		var clearCompleted = document.getElementById('clear-completed');

		footer.style.display = todos.length ? 'block' : 'none';

		// update todo count
		var text = ' ' + ( stat.todoLeft === 1 ? 'item' : 'items' ) + ' left';
		todoCount.innerHTML = '<strong>' + stat.todoLeft + '</strong>' + text;

		// show/hide clear completed
		clearCompleted.style.display = stat.todoCompleted ? 'block' : 'none';
		clearCompleted.innerHTML = 'Clear completed (' + stat.todoCompleted + ')';
	}

	function getUuid() {
		var i, random,
			uuid = '';

		for ( i = 0; i < 32; i++ ) {
			random = Math.random() * 16 | 0;
			if ( i === 8 || i === 12 || i === 16 || i === 20 ) {
				uuid += '-';
			}
			uuid += ( i === 12 ? 4 : (i === 16 ? (random & 3 | 8) : random) ).toString( 16 );
		}
		return uuid;
	}
})();
