function DailyActuals() {
    var rallyDataSource;
    var userHash;
    var taskHash;
    var dropdown;
    var waiter;
	var iterations;
	var taskCounter = 0;

    function Hash() {
        this._hash = {};
    }
	
	function DatedHash() {
        this._datedhash = {};
    }

    Hash.prototype.set = function(i, j, v) {
        if (this._hash[i] === undefined) {
            this._hash[i] = {};
        }
		
        this._hash[i][j] = v;


    };
	
	DatedHash.prototype.set = function(i, j, k, l, v) {
        if (this._datedhash[i] === undefined) {
            this._datedhash[i] = {};
        }
		if (this._datedhash[i][j] === undefined) {
            this._datedhash[i][j] = {};
        }
		this._datedhash[i][j][k][l] = v;
	};
	
	DatedHash.prototype.get = function(i, j, k, l) {
        if (j === undefined && k === undefined && l === undefined ) {
            return this._datedhash[i];
        }
        else if (k === undefined && l === undefined) {
            return this._datedhash[i][j];
        }
		else if (l === undefined) {
            return this._datedhash[i][j][k];
        }
		else
		{
			if (this._datedhash[i] === undefined) {
				this._datedhash[i] = [];
			}
			if (this._datedhash[i][j] === undefined) {
				this._datedhash[i][j] = {};
			}
			if (this._datedhash[i][j][k] === undefined) {
				this._datedhash[i][j][k] = {};
			}
			if(this._datedhash[i][j][k][l] === undefined)
			{
				this._datedhash[i][j][k][l] = 0;
			}
		}
		
        return this._datedhash[i][j][k][l];
    };

    Hash.prototype.get = function(i, j) {
        if (this._hash[i] === undefined) {
            this._hash[i] = {};
        }
        if (this._hash[i][j] === undefined) {
            this._hash[i][j] = 0;
        }
        return this._hash[i][j];
    };

    

    function processRevisions(task, revs, owner, project) {
	
		function parseRallyDate(dateStr) {
			var day = dateStr.slice(8, 10);
			var month = dateStr.slice(5, 7) - 1;
			var year = dateStr.slice(0, 4);
			var hour = dateStr.slice(11, 13);
			var min = dateStr.slice(14, 16);
			var sec = dateStr.slice(17, 19);
			var date = new Date(year, month, day, hour, min, sec);
			date.setTime(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
			date.setHours(0);
			date.setMinutes(0);
			date.setSeconds(0);
			date.setMilliseconds(0);
			return date;
		}

        // MJR changed, removed the units and just put in a placeholder
        var regExp1 = /ACTUALS added \[([0-9\.]*) [A-Za-z]*\]/;
        var regExp2 = /ACTUALS changed from \[([0-9\.]*) [A-Za-z]*\] to \[([0-9\.]*) [A-Za-z]*\]/;
        var regExp3 = /OWNER added \[([a-z\@\.]*)\]/;
        var regExp4 = /OWNER changed from \[([a-z\@\.]*)\] to \[([a-z\@\.]*)\]/;

        for (var r in revs) {
            if(revs.hasOwnProperty(r)) {
                var rev = revs[r];

                var ownerName;

                if (!owner) {
                    ownerName = "No Owner";
                } else {
                    ownerName = owner.DisplayName;
                }

                r = regExp1.exec(rev.Description);
                if (r) {
                    userHash.set(ownerName, project,
                            userHash.get(ownerName, project) + parseFloat(r[1]));
                    userHash.set(ownerName, 'Total',
                            userHash.get(ownerName, 'Total') + parseFloat(r[1]));
                    userHash.set('Total', project,
                            userHash.get('Total', project) + parseFloat(r[1]));
					taskHash.set(ownerName, parseRallyDate(rev.CreationDate), task.FormattedID, 'Actuals',
                            taskHash.get(ownerName, parseRallyDate(rev.CreationDate), task.FormattedID, 'Actuals') + parseFloat(r[1]));		
                }

                r = regExp2.exec(rev.Description);
                if (r) {
                    userHash.set(ownerName, project,
                            userHash.get(ownerName, project) + parseFloat(r[2]) - parseFloat(r[1]));
                    userHash.set(ownerName, 'Total',
                            userHash.get(ownerName, 'Total') + parseFloat(r[2]) - parseFloat(r[1]));
                    userHash.set('Total', project,
                            userHash.get('Total', project) + parseFloat(r[2]) - parseFloat(r[1]));

                    taskHash.set(ownerName, parseRallyDate(rev.CreationDate), task.FormattedID, 'Actuals',
                            taskHash.get(ownerName, parseRallyDate(rev.CreationDate), task.FormattedID, 'Actuals') + (parseFloat(r[2]) - parseFloat(r[1])));
                }
                r = regExp3.exec(rev.Description);
                if (r) {
                    ownerName = r[1];
                }
                r = regExp4.exec(rev.Description);
                if (r) {
                    ownerName = r[1];
                }
            }
        }
    }
	
	function getRevisionHistory(array, task) {
        var ref = task.RevisionHistory._ref;
        var rhId = /(\d+)\.js/.exec(ref)[1];
        for (var i in array) {
            if (array[i].ObjectID == rhId) {
                return array[i].Revisions;
            }
        }
        return undefined;
    }

    function getTask(array, formattedID) {
        for (var i in array) {
            if (array[i].FormattedID == formattedID) {
                return array[i];
            }
        }
        return undefined;
    }

    function genUserTable(results) {
        var cmpProject = function(a, b) {
            if (a._ref < b._ref) {
                return -1;
            }
            else if (a._ref == b._ref) {
                return 0;
            }
            else {
                return 1;
            }
        };

        var cmpUser = function(a, b) {
            if (a.DisplayName < b.DisplayName) {
                return -1;
            }
            else if (a.DisplayName == b.DisplayName) {
                return 0;
            }
            else {
                return 1;
            }
        };

        // MJR - changed wording
        var tbl = '<div class="title">Actuals By User</div>';
        tbl += '<table class="data-table" border="0" cellpadding="0" cellspacing="0">';
        tbl += '<tr><th class="center">User</th><th class="center">Total</th>';

        for (var p in results.projects.sort(cmpProject)) {
            if (userHash.get('Total', results.projects[p]._ref) > 0) {
                // MJR - Put more of the name here
                tbl += '<th class="center">';
                if (results.projects[p]._refObjectName.length > 20) {
                    tbl += "...";
                }
                tbl += results.projects[p]._refObjectName.substr(-20) + "</th>";
            }
        }


        var userCounter = 0;

        tbl += '</tr>';

        for (var u in results.users.sort(cmpUser)) {
            if(results.users.hasOwnProperty(u)) {
                var days;

                if (userHash.get(results.users[u].DisplayName, 'Total') > 0) {
                    userCounter += 1;
                    tbl += '<tr>';
                    tbl += '<td class="left">' + results.users[u].DisplayName + '</td>';

                    days = userHash.get(results.users[u].DisplayName, 'Total');
                    if (days > 0.0) {
                        tbl += '<td class="center highlite-good">' + days + '</td>';
                    }
                    else {
                        tbl += '<td class="center">' + days + '</td>';
                    }
                    for (var p2 in results.projects.sort(cmpProject)) {
                        if (userHash.get('Total', results.projects[p2]._ref) > 0) {
                            days = userHash.get(results.users[u].DisplayName, results.projects[p2]._ref);
                            if (days > 0.0) {
                                tbl += '<td class="center highlite-good">' + days + '</td>';
                            }
                            else {
                                tbl += '<td class="center">' + days + '</td>';
                            }
                        }
                    }
                    tbl += '</tr>';
                }
            }
        }
        if (userCounter === 0) {
            tbl += '<tr><td>No Actuals found on Tasks or no Tasks found</td></tr>';
        }

        tbl += '</table>';
        document.getElementById('user-table-div').innerHTML = tbl;
    }

    function taskRow(task, effort, day) {
        var ownerName;
		if (!task.Owner) {
            ownerName = "No Owner";
        } else {
            ownerName = task.Owner.DisplayName;
        }
		var tbl = '';
		
		tbl += '<tr>';
		tbl += '<td class="left">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + task.FormattedID + '</td>';
		tbl += '<td class="left">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + task.Name + '</td>';
		tbl += '<td class="left">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + task.WorkProduct.FormattedID + '</td>';
		tbl += '<td class="left">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + task.WorkProduct.Name + '</td>';
		tbl += '<td class="center"><table class="state-table"><tr>';
		tbl += '<td class="none"><div>-</div></td>';
		// defined state
		if ((task.State == "Defined") && (task.Blocked)) {
			c = "blocked";
		}
		else if ((task.State == "Defined") || (task.State == "In-Progress") || (task.State == "Completed")) {
			c = "selected";
		}
		else {
			c = "";
		}
		tbl += '<td class="' + c + '"><div>D</div></td>';
		// in-progress state
		if ((task.State == "In-Progress") && (task.Blocked)) {
			c = "blocked";
		}
		else if ((task.State == "In-Progress") || (task.State == "Completed")) {
			c = "selected";
		}
		else {
			c = "";
		}
		tbl += '<td class="' + c + '"><div>P</div></td>';
		// completed state
		if ((task.State == "Completed") && (task.Blocked)) {
			c = "blocked";
		}
		else if (task.State == "Completed") {
			c = "selected";
		}
		else {
			c = "";
		}
		tbl += '<td class="' + c + '"><div>C</div></td>';
		tbl += '</tr></table></td>';
		tbl += '<td class="center">' + ((effort.Actuals > 0) ? "+" : "") + effort.Actuals + '</td>';
		tbl += '<td class="center">' + task.Project._refObjectName + '</td>';
		tbl += '<td class="center">' + ownerName + '</td>';
		var date = new Date(day);
		tbl += '<td class="center">' + date.toLocaleDateString() + '</td>';
		tbl += '</tr>';
		
        return tbl;
    }

    function genTaskTable(results) {
		var cmpDates = function(a, b) {
			var date1 = new Date(a);
			var date2 = new Date(b);
            if (date1 < date2) {
                return -1;
            }
            else if (date1 == date2) {
                return 0;
            }
            else {
                return 1;
            }
        };
	
		var tbl = '<div class="title">Tasks Actuals</div>';
		tbl += '<span id="exportBtn"></span>';
        tbl += '<table class="data-table" border="0" cellpadding="0" cellspacing="0" id="task-table">';
        tbl += '<tr>' +
                '<th class="left">Task ID</th><th class="left">Task Name</th>' +
				'<th class="left">USM#</th><th class="left">USM Description</th>' +
                '<th class="center">State</th><th class="center">Actuals</th>' +
                '<th class="center">Project</th><th class="center">Owner</th>' +
				'<th class="center">Date</th>' +
                '</tr>';

        var tids = [];
        for (var t in taskHash._datedhash) {
            if(taskHash._datedhash.hasOwnProperty(t)) {
                tids.push(t);
            }
        }
        
        for (var t2 in tids) {
            if(tids.hasOwnProperty(t2)) {
                var userLoggedDates = taskHash.get(tids[t2]);
				var userLoggedDatesArr = [];
				for (var t3 in userLoggedDates) {
					if(userLoggedDates.hasOwnProperty(t3)) {
						userLoggedDatesArr.push(t3);
					}
				}
				userLoggedDatesArr.sort(cmpDates);
				userLoggedDatesArr.reverse();
				for (var t4 in userLoggedDatesArr) {
					if(userLoggedDatesArr.hasOwnProperty(t4)) {
						var tasksOnDate = taskHash.get(tids[t2],userLoggedDatesArr[t4]);
						for (var t5 in tasksOnDate) {
							if(tasksOnDate.hasOwnProperty(t5)) {
								tbl += taskRow(getTask(results.tasks,t5), tasksOnDate[t5], userLoggedDatesArr[t4]);
								taskCounter += 1;
							}
						}
					}
				}
            }
        }
        if (taskCounter === 0) {
            tbl += '<tr><td>No Actuals found on Tasks or no Tasks found</td></tr>';
        }
		
        tbl += '</table>';
        document.getElementById('task-table-div').innerHTML = tbl;
    }

    function processTasks(results) {
		userHash = new Hash();
        taskHash = new DatedHash();
        for (var t in results.tasks) {
            if(results.tasks.hasOwnProperty(t)) {
                var task = results.tasks[t];
                var revs = getRevisionHistory(results.revs, task);
                var owner = task.Owner;
				processRevisions(task, revs, owner, task.Project._ref);
            }
        }

        genUserTable(results);
		genTaskTable(results);
		if(taskCounter > 0)
		{
			genExportToExcelButton();
		}
        waiter.hide();
    }
	
	function genExportToExcelButton()
	{
		var buttonConfig = { text: "Export to Excel" };
		var button = new rally.sdk.ui.basic.Button(buttonConfig);
		button.display("exportBtn", exportToExcel);
	}
	
	var tableToExcel = (function() {
		  var uri = 'data:application/vnd.ms-excel;base64,'
			, template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>'
			, base64 = function(s) { return window.btoa(unescape(encodeURIComponent(s))) }
			, format = function(s, c) { return s.replace(/{(\w+)}/g, function(m, p) { return c[p]; }) }
		  return function(table, name) {
			if (!table.nodeType) table = document.getElementById(table)
			var ctx = {worksheet: name || 'Worksheet', table: table.innerHTML}
			window.location.href = uri + base64(format(template, ctx))
		  }
		})();
	
	function exportToExcel()
	{
		tableToExcel("task-table", "TaskReport - " + iterDropdown.getSelectedName());
	}
	
	

    function fetchTasks() {
        dojo.byId("user-table-div").innerHTML = '';
        dojo.byId("task-table-div").innerHTML = '';
        waiter.display("waiter");

		var queryObjectArr = [];
        queryObjectArr[0] = {
            key: 'tasks',
            type: 'tasks',
            fetch: 'FormattedID,Project,Name,Owner,State,Blocked,RevisionHistory,WorkProduct,DisplayName,Iteration',
            query: '(Iteration.Name = "' + iterDropdown.getSelectedName() + '")'
        };
		
        queryObjectArr[1] = {
            key: 'stories',
            type: 'hierarchicalrequirements',
            fetch: 'ObjectID,FormattedID,Project,Name,Owner,ScheduleState,Blocked,DisplayName,Iteration',
            query: '(Iteration.Name = "' + iterDropdown.getSelectedName() + '")'
        };
		queryObjectArr[2] = {
            key: 'defects',
            type: 'defects',
            fetch: 'ObjectID,FormattedID,Project,Name,Owner,ScheduleState,Blocked,DisplayName,Iteration',
            query: '(Iteration.Name >= "' + iterDropdown.getSelectedName() + '")'
        };
        queryObjectArr[3] = {
            key: 'revs',
            placeholder: '${tasks/revisionhistory?fetch=ObjectID,revisions}'
        };
        queryObjectArr[4] = {
            key: 'users',
            type: 'users',
            fetch: 'EmailAddress,DisplayName'
        };
        queryObjectArr[5] = {
            key: 'projects',
            type: 'projects',
            query: '(State = Open)'
        };
		rallyDataSource.findAll(queryObjectArr, processTasks);
    }
	
	this.display = function(element) {
        rally.sdk.ui.AppHeader.showPageTools(true);

        waiter = new rally.sdk.ui.basic.Wait({hideTarget:false});

        rallyDataSource = new rally.sdk.data.RallyDataSource('__WORKSPACE_OID__',
                '__PROJECT_OID__',
                '__PROJECT_SCOPING_UP__',
                '__PROJECT_SCOPING_DOWN__');

        	
		var iterConfig = {};
		iterDropdown = new rally.sdk.ui.IterationDropdown(iterConfig, rallyDataSource);
		iterDropdown.display(document.getElementById("timePeriodSelect"), fetchTasks);
		
    };
}
