// script.js

const STORAGE_KEY = "elanLedBills";
const COUNTER_KEY = "elanLedDocumentCounter";

const $ = (id) => document.getElementById(id);

let items = [];


// ============================================================
// DATE
// ============================================================

function todayISO() {

  const d = new Date();

  const local =
    new Date(
      d.getTime() -
      d.getTimezoneOffset() * 60000
    );

  return local
    .toISOString()
    .slice(0, 10);
}


// ============================================================
// DOCUMENT NUMBER
// ============================================================

function getNextNumber(type = "Estimate") {

  const prefixes = {

    "Estimate": "EST",

    "Tax Invoice": "INV",

    "Delivery Challan": "CHL"

  };


  const prefix =
    prefixes[type] || "EST";


  const counterKey =
    `${COUNTER_KEY}_${prefix}`;


  const current =
    parseInt(
      localStorage.getItem(counterKey) || "0",
      10
    ) + 1;


  localStorage.setItem(
    counterKey,
    String(current)
  );


  return `${prefix}-${String(current).padStart(4, "0")}`;
}



// ============================================================
// DOCUMENT LABEL
// ============================================================

function getDocumentNumberLabel(type) {

  if (type === "Tax Invoice") {

    return "Invoice No.";

  }


  if (type === "Delivery Challan") {

    return "Challan No.";

  }


  return "Estimate No.";

}



// ============================================================
// FORMAT MONEY
// ============================================================

function formatMoney(value) {

  return "₹" +

    Number(value || 0)
      .toLocaleString(
        "en-IN",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      );

}



// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

  return String(value ?? "")

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}



// ============================================================
// NUMBER TO WORDS
// ============================================================

function numberToWordsIndian(num) {

  num =
    Math.round(
      Number(num) || 0
    );


  if (num === 0) {

    return "Rupees Zero Only";

  }


  const ones = [

    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen"

  ];


  const tens = [

    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety"

  ];


  function twoDigits(n) {

    if (n < 20) {

      return ones[n];

    }


    return (

      tens[Math.floor(n / 10)] +

      (

        n % 10
          ? " " + ones[n % 10]
          : ""

      )

    );

  }



  function underThousand(n) {

    let result = "";


    if (n >= 100) {

      result +=
        ones[Math.floor(n / 100)] +
        " Hundred";

      n %= 100;


      if (n) {

        result += " ";

      }

    }


    if (n) {

      result +=
        twoDigits(n);

    }


    return result;

  }



  let result = "";


  const crore =
    Math.floor(
      num / 10000000
    );


  num %= 10000000;


  const lakh =
    Math.floor(
      num / 100000
    );


  num %= 100000;


  const thousand =
    Math.floor(
      num / 1000
    );


  num %= 1000;



  if (crore) {

    result +=
      underThousand(crore) +
      " Crore ";

  }


  if (lakh) {

    result +=
      underThousand(lakh) +
      " Lakh ";

  }


  if (thousand) {

    result +=
      underThousand(thousand) +
      " Thousand ";

  }


  if (num) {

    result +=
      underThousand(num);

  }


  return (
    "Rupees " +
    result.trim() +
    " Only"
  );

}



// ============================================================
// CREATE ITEM
// ============================================================

function createItem(data = {}) {

  return {

    name:
      data.name || "",

    hsn:
      data.hsn || "",

    qty:
      data.qty ?? 1,

    rate:
      data.rate ?? 0,

    gst:
      data.gst ?? 18

  };

}



// ============================================================
// ADD ITEM
// ============================================================

function addItem(data) {

  items.push(
    createItem(data)
  );


  renderEditorItems();

  updateAll();

}



// ============================================================
// REMOVE ITEM
// ============================================================

function removeItem(index) {

  if (items.length === 1) {

    items[0] =
      createItem();

  }

  else {

    items.splice(
      index,
      1
    );

  }


  renderEditorItems();

  updateAll();

}



// ============================================================
// RENDER EDITOR ITEMS
// ============================================================

function renderEditorItems() {

  const tbody =
    $("itemEditorBody");


  tbody.innerHTML = "";


  items.forEach(
    (item, index) => {

      const tr =
        document.createElement("tr");


      tr.innerHTML = `

        <td>
          ${index + 1}
        </td>


        <td>

          <input

            class="item-name"

            data-index="${index}"

            data-field="name"

            value="${escapeHTML(item.name)}"

            placeholder="Item name"

          >

        </td>


        <td>

          <input

            data-index="${index}"

            data-field="hsn"

            value="${escapeHTML(item.hsn)}"

            placeholder="HSN/SAC"

          >

        </td>


        <td>

          <input

            type="number"

            min="0"

            step="0.01"

            data-index="${index}"

            data-field="qty"

            value="${item.qty}"

          >

        </td>


        <td>

          <input

            type="number"

            min="0"

            step="0.01"

            data-index="${index}"

            data-field="rate"

            value="${item.rate}"

          >

        </td>


        <td>

          <input

            type="number"

            min="0"

            step="0.01"

            data-index="${index}"

            data-field="gst"

            value="${item.gst}"

          >

        </td>


        <td class="row-gst">
          ₹0.00
        </td>


        <td class="row-total">
          ₹0.00
        </td>


        <td>

          <button

            class="remove-item"

            data-remove="${index}"

          >
            ×
          </button>

        </td>

      `;


      tbody.appendChild(tr);

    }
  );



  tbody
    .querySelectorAll("input")
    .forEach(
      input => {

        input.addEventListener(
          "input",
          e => {

            const index =
              Number(
                e.target.dataset.index
              );


            const field =
              e.target.dataset.field;


            let value =
              e.target.value;


            if (
              [
                "qty",
                "rate",
                "gst"
              ].includes(field)
            ) {

              value =
                Number(value) || 0;

            }


            items[index][field] =
              value;


            updateAll();

          }
        );

      }
    );



  tbody
    .querySelectorAll("[data-remove]")
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            removeItem(
              Number(
                button.dataset.remove
              )
            );

          }
        );

      }
    );


  updateEditorRowValues();

}



// ============================================================
// CALCULATE
// ============================================================

function calculate() {

  let subtotal = 0;

  let totalGST = 0;


  const rows =
    items.map(item => {

      const base =

        Math.max(
          0,
          Number(item.qty) || 0
        )

        *

        Math.max(
          0,
          Number(item.rate) || 0
        );


      const gstAmount =

        base *

        (
          Math.max(
            0,
            Number(item.gst) || 0
          )
          /
          100
        );


      const total =
        base +
        gstAmount;


      subtotal += base;

      totalGST += gstAmount;


      return {

        ...item,

        base,

        gstAmount,

        total

      };

    });


  return {

    rows,

    subtotal,

    cgst:
      totalGST / 2,

    sgst:
      totalGST / 2,

    gst:
      totalGST,

    grandTotal:
      subtotal + totalGST

  };

}



// ============================================================
// UPDATE EDITOR ROWS
// ============================================================

function updateEditorRowValues() {

  const result =
    calculate();


  const rows =
    $("itemEditorBody")
      .querySelectorAll("tr");


  rows.forEach(
    (tr, index) => {

      if (result.rows[index]) {

        tr.querySelector(
          ".row-gst"
        ).textContent =
          formatMoney(
            result.rows[index]
              .gstAmount
          );


        tr.querySelector(
          ".row-total"
        ).textContent =
          formatMoney(
            result.rows[index]
              .total
          );

      }

    }
  );

}



// ============================================================
// GET FORM DATA
// ============================================================

function getFormData() {

  return {

    type:
      $("documentType").value,

    number:
      $("documentNumber").value,

    date:
      $("documentDate").value,

    customerName:
      $("customerName").value,

    customerPhone:
      $("customerPhone").value,

    customerAddress:
      $("customerAddress").value,

    customerGSTIN:
      $("customerGSTIN").value,

    estimateFor:
      $("estimateFor").value,

    shippingAddress:
      $("shippingAddress").value,

    notes:
      $("notes").value,

    items:
      JSON.parse(
        JSON.stringify(items)
      ),

    savedAt:
      new Date().toISOString()

  };

}



// ============================================================
// UPDATE PREVIEW
// ============================================================

function updatePreview() {

  const data =
    getFormData();


  const result =
    calculate();



  $("previewDocumentType")
    .textContent =
      data.type.toUpperCase();



  // ==========================================
  // DYNAMIC LABELS
  // ==========================================

  const purposeLabel =

    data.type === "Tax Invoice"

      ? "Bill To"

      : data.type === "Delivery Challan"

        ? "Deliver To"

        : "Estimate For";



  $("purposeSectionTitle")
    .textContent =
      purposeLabel;



  $("previewCustomerLabel")
    .textContent =

      data.type === "Tax Invoice"

        ? "Bill To / Customer"

        : purposeLabel +
          " / Customer";



  $("previewPurposeLabel")
    .textContent =
      purposeLabel + ":";



  $("documentNumberLabel")
    .childNodes[0]
    .textContent =

      getDocumentNumberLabel(
        data.type
      ) + "\n";



  // ==========================================
  // BASIC INFORMATION
  // ==========================================

  $("previewDocumentNumber")
    .textContent =
      data.number;


  $("previewDocumentDate")
    .textContent =

      data.date

        ? new Date(
            data.date +
            "T00:00:00"
          )
          .toLocaleDateString(
            "en-IN"
          )

        : "";



  // ==========================================
  // CUSTOMER
  // ==========================================

  $("previewCustomerName")
    .textContent =
      data.customerName ||
      "—";


  $("previewCustomerAddress")
    .textContent =
      data.customerAddress ||
      "—";


  $("previewCustomerPhone")
    .textContent =

      data.customerPhone

        ? "Phone: " +
          data.customerPhone

        : "";



  $("previewCustomerGSTIN")
    .textContent =

      data.customerGSTIN

        ? "GSTIN: " +
          data.customerGSTIN

        : "";



  $("previewEstimateFor")
    .textContent =
      data.estimateFor ||
      "—";


  $("previewShippingAddress")
    .textContent =
      data.shippingAddress ||
      "—";


  $("previewNotes")
    .textContent =
      data.notes ||
      "—";



  // ==========================================
  // ITEMS
  // ==========================================

  const tbody =
    $("invoicePreviewBody");


  tbody.innerHTML = "";


  result.rows.forEach(
    (row, index) => {

      const tr =
        document.createElement("tr");


      tr.innerHTML = `

        <td>
          ${index + 1}
        </td>


        <td>
          ${escapeHTML(
            row.name || "—"
          )}
        </td>


        <td>
          ${escapeHTML(
            row.hsn || "—"
          )}
        </td>


        <td>
          ${row.qty}
        </td>


        <td>
          ${formatMoney(
            row.rate
          )}
        </td>


        <td>
          ${row.gst}%
        </td>


        <td>
          ${formatMoney(
            row.gstAmount
          )}
        </td>


        <td>
          ${formatMoney(
            row.total
          )}
        </td>

      `;


      tbody.appendChild(tr);

    }
  );



  // ==========================================
  // TOTALS
  // ==========================================

  $("previewSubtotal")
    .textContent =
      formatMoney(
        result.subtotal
      );


  $("previewCGST")
    .textContent =
      formatMoney(
        result.cgst
      );


  $("previewSGST")
    .textContent =
      formatMoney(
        result.sgst
      );


  $("previewGrandTotal")
    .textContent =
      formatMoney(
        result.grandTotal
      );


  $("previewAmountWords")
    .textContent =
      numberToWordsIndian(
        result.grandTotal
      );



  $("editSubtotal")
    .textContent =
      formatMoney(
        result.subtotal
      );


  $("editCGST")
    .textContent =
      formatMoney(
        result.cgst
      );


  $("editSGST")
    .textContent =
      formatMoney(
        result.sgst
      );


  $("editGrandTotal")
    .textContent =
      formatMoney(
        result.grandTotal
      );

}



// ============================================================
// UPDATE EVERYTHING
// ============================================================

function updateAll() {

  updateEditorRowValues();

  updatePreview();

}



// ============================================================
// CHANGE DOCUMENT TYPE
// ============================================================

function changeDocumentType() {

  const selectedType =
    $("documentType").value;


  const currentNumber =
    $("documentNumber").value;


  const prefixes = {

    "Estimate":
      "EST-",

    "Tax Invoice":
      "INV-",

    "Delivery Challan":
      "CHL-"

  };


  const expectedPrefix =
    prefixes[selectedType] ||
    "EST-";



  /*
    If the document type changes,
    automatically generate a number
    belonging to that document type.

    Example:

    Estimate
    EST-0001

    Tax Invoice
    INV-0001

    Delivery Challan
    CHL-0001
  */

  if (
    !currentNumber
      .startsWith(
        expectedPrefix
      )
  ) {

    $("documentNumber")
      .value =
        getNextNumber(
          selectedType
        );

  }


  updateAll();

}



// ============================================================
// RESET / NEW BILL
// ============================================================

function resetForm() {

  $("documentType")
    .value =
      "Estimate";


  $("documentNumber")
    .value =
      getNextNumber(
        "Estimate"
      );


  $("documentDate")
    .value =
      todayISO();


  $("customerName")
    .value = "";


  $("customerPhone")
    .value = "";


  $("customerAddress")
    .value = "";


  $("customerGSTIN")
    .value = "";


  $("estimateFor")
    .value = "";


  $("shippingAddress")
    .value = "";


  $("notes")
    .value = "";


  items = [
    createItem()
  ];


  $("saveStatus")
    .textContent = "";


  renderEditorItems();

  updateAll();

}



// ============================================================
// SAVE BILL
// ============================================================

function saveBill() {

  const data =
    getFormData();


  const result =
    calculate();



  if (
    !data.customerName.trim()
  ) {

    alert(
      "Please enter the customer name."
    );

    $("customerName")
      .focus();

    return;

  }



  if (
    !data.items.some(
      item =>
        item.name.trim()
    )
  ) {

    alert(
      "Please add at least one item."
    );

    return;

  }



  data.total =
    result.grandTotal;



  const bills =
    JSON.parse(
      localStorage.getItem(
        STORAGE_KEY
      ) || "[]"
    );



  const existingIndex =
    bills.findIndex(
      bill =>
        bill.number ===
        data.number
    );



  if (
    existingIndex >= 0
  ) {

    bills[existingIndex] =
      data;

  }

  else {

    bills.unshift(data);

  }



  localStorage.setItem(

    STORAGE_KEY,

    JSON.stringify(
      bills
    )

  );



  $("saveStatus")
    .textContent =

      `${data.number} saved in this browser.`;

}



// ============================================================
// LOAD BILL
// ============================================================

function loadBill(data) {

  $("documentType")
    .value =
      data.type;


  $("documentNumber")
    .value =
      data.number;


  $("documentDate")
    .value =
      data.date;


  $("customerName")
    .value =
      data.customerName ||
      "";


  $("customerPhone")
    .value =
      data.customerPhone ||
      "";


  $("customerAddress")
    .value =
      data.customerAddress ||
      "";


  $("customerGSTIN")
    .value =
      data.customerGSTIN ||
      "";


  $("estimateFor")
    .value =
      data.estimateFor ||
      "";


  $("shippingAddress")
    .value =
      data.shippingAddress ||
      "";


  $("notes")
    .value =
      data.notes ||
      "";


  items =
    (
      data.items ||
      [createItem()]
    )
    .map(createItem);


  renderEditorItems();

  updateAll();



  $("historyModal")
    .classList
    .remove("show");


  $("saveStatus")
    .textContent =
      `${data.number} loaded.`;



  window.scrollTo({

    top: 0,

    behavior: "smooth"

  });

}



// ============================================================
// DELETE BILL
// ============================================================

function deleteBill(number) {

  if (
    !confirm(
      `Delete ${number}?`
    )
  ) {

    return;

  }



  const bills =
    JSON.parse(
      localStorage.getItem(
        STORAGE_KEY
      ) || "[]"
    );


  const updated =
    bills.filter(
      bill =>
        bill.number !==
        number
    );


  localStorage.setItem(

    STORAGE_KEY,

    JSON.stringify(
      updated
    )

  );


  renderHistory();

}



// ============================================================
// HISTORY
// ============================================================

function renderHistory() {

  const bills =
    JSON.parse(
      localStorage.getItem(
        STORAGE_KEY
      ) || "[]"
    );


  const container =
    $("historyList");



  if (!bills.length) {

    container.innerHTML = `

      <div class="empty-history">

        No saved bills yet.

      </div>

    `;

    return;

  }



  container.innerHTML =

    bills.map(
      bill => `

        <div class="history-row">

          <div class="history-info">

            <strong>

              ${escapeHTML(
                bill.number
              )}

              —

              ${escapeHTML(
                bill.type
              )}

            </strong>


            <small>

              ${escapeHTML(
                bill.customerName ||
                "No customer"
              )}

              |

              ${escapeHTML(
                bill.date ||
                ""
              )}

              |

              ${formatMoney(
                bill.total
              )}

            </small>

          </div>


          <div class="history-actions">

            <button

              class="load-history"

              data-load="${escapeHTML(
                bill.number
              )}"

            >

              Open

            </button>


            <button

              class="delete-history"

              data-delete="${escapeHTML(
                bill.number
              )}"

            >

              Delete

            </button>

          </div>

        </div>

      `
    )
    .join("");



  container
    .querySelectorAll(
      "[data-load]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const found =
              bills.find(
                bill =>
                  bill.number ===
                  button.dataset.load
              );


            if (found) {

              loadBill(found);

            }

          }
        );

      }
    );



  container
    .querySelectorAll(
      "[data-delete]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            deleteBill(
              button.dataset.delete
            );

          }
        );

      }
    );

}



// ============================================================
// BUTTON EVENTS
// ============================================================

$("addItemBtn")
  .addEventListener(
    "click",
    () => addItem()
  );


$("newBillBtn")
  .addEventListener(
    "click",
    resetForm
  );


$("saveBtn")
  .addEventListener(
    "click",
    saveBill
  );


$("printBtn")
  .addEventListener(
    "click",
    () => {

      updateAll();

      window.print();

    }
  );


$("historyBtn")
  .addEventListener(
    "click",
    () => {

      renderHistory();

      $("historyModal")
        .classList
        .add("show");

    }
  );


$("closeHistory")
  .addEventListener(
    "click",
    () => {

      $("historyModal")
        .classList
        .remove("show");

    }
  );


$("historyModal")
  .addEventListener(
    "click",
    e => {

      if (
        e.target ===
        $("historyModal")
      ) {

        $("historyModal")
          .classList
          .remove("show");

      }

    }
  );



// ============================================================
// FORM EVENTS
// ============================================================

$("documentType")
  .addEventListener(
    "change",
    changeDocumentType
  );



[
  "documentDate",
  "customerName",
  "customerPhone",
  "customerAddress",
  "customerGSTIN",
  "estimateFor",
  "shippingAddress",
  "notes"
].forEach(
  id => {

    $(id)
      .addEventListener(
        "input",
        updateAll
      );


    $(id)
      .addEventListener(
        "change",
        updateAll
      );

  }
);



// ============================================================
// START APPLICATION
// ============================================================

resetForm();