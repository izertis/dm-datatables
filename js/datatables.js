(function ($) {
  Drupal.behaviors.datatables = {
    attach: function (context, settings) {
      $.each(settings.datatables, function (selector) {
        $(selector, context).once('datatables', function() {
          new Drupal.datatables.dataTable(selector);
        });
      });
    }
  };

  Drupal.datatables = {};

  /**
   * Javascript object for a specific datatable.
   */
  Drupal.datatables.dataTable = function(selector) {
    this.selector = selector;
    this.settings = Drupal.settings.datatables[selector];

    // Check if table contains expandable hidden rows.
    if (this.settings.bExpandable) {
      this.preExpandable();
    }

    if (this.settings.sAjaxSource) {
      this.initAjax();
    }

    this.datatable = $(this.selector).dataTable(this.settings);

    if (this.settings.bExpandable) {
      this.postExpandable()
    }
  }

  Drupal.datatables.dataTable.prototype.initAjax = function() {
    var local_settings = this.settings;
    this.settings.fnServerData = function(sSource, aoData, fnCallback, oSettings) {
      var data = local_settings.datatablesViews;
      data.aoData = aoData;
      oSettings.jqXHR = $.ajax( {
        "url":  sSource,
        "data": data,
        "success": function (json) {
          $(oSettings.oInstance).trigger('xhr', oSettings);
          fnCallback( json );
        },
        "dataType": "json",
        "cache": false,
        "type": oSettings.sServerMethod,
        "error": function (xhr, error, thrown) {
          if ( error == "parsererror" ) {
            alert( "DataTables warning: JSON data from server could not be parsed. "+
              "This is caused by a JSON formatting error." );
          }
        }
      } );
    }
  }

  Drupal.datatables.dataTable.prototype.preExpandable = function() {
    // Insert a "view more" column to the table.
    var nCloneTh = document.createElement('th');
    var nCloneTd = document.createElement('td');
    nCloneTd.innerHTML = '<a href="#" class="datatables-expand datatables-closed">Show Details</a>';

    $(this.selector + ' thead tr').each( function () {
      this.insertBefore( nCloneTh, this.childNodes[0] );
    });

    $(this.selector + ' tbody tr').each( function () {
      this.insertBefore(  nCloneTd.cloneNode( true ), this.childNodes[0] );
    });

    this.settings.aoColumns.unshift({"bSortable": false});
  }

  Drupal.datatables.dataTable.prototype.postExpandable = function() {
    // Add column headers to table settings.
    var datatables_settings = this.datatable.fnSettings();
    // Add blank column header for show details column.
    this.settings.aoColumnHeaders.unshift('');
    // Add column headers to table settings.
    datatables_settings.aoColumnHeaders = this.settings.aoColumnHeaders;

    /* Add event listener for opening and closing details
     * Note that the indicator for showing which row is open is not controlled by DataTables,
     * rather it is done here
     */
    $('td a.datatables-expand', this.datatable.fnGetNodes() ).each( function () {
      $(this).click( function () {
        var row = this.parentNode.parentNode;
        if (this.datatable.fnIsOpen(row)) {
          this.datatable.fnClose(row);
          $(this).html('Show Details');
        }
        else {
          this.datatable.fnOpen( row, Drupal.theme('datatablesExpandableRow', this.datatable, row), 'details' );
          $(this).html('Hide Details');
        }
      return false;
      });
    });
  }

  /*
  * Theme an expandable hidden row.
  *
  * @param object
  *   The datatable object.
  * @param array
  *   The row array for which the hidden row is being displayed.
  * @return
  *   The formatted text (html).
  */
  Drupal.theme.prototype.datatablesExpandableRow = function(datatable, row) {
    var rowData = datatable.fnGetData(row);
    var settings = datatable.fnSettings();

    var output = '<table style="padding-left: 50px">';
    $.each(rowData, function(index) {
      if (!settings.aoColumns[index].bVisible) {
        output += '<tr><td>' + settings.aoColumnHeaders[index] + '</td><td style="text-align: left">' + this + '</td></tr>';
      }
    });
    output += '</table>';
    return output;
  };
})(jQuery);
