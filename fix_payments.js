const fs = require('fs');
const file = 'src/app/components/Payments.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove states
content = content.replace(/const \[customerInvoices, setCustomerInvoices\] = useState.*?\n/, '');
content = content.replace(/const \[loadingInvoices, setLoadingInvoices\] = useState.*?\n/, '');
content = content.replace(/const \[selectedInvoiceIds, setSelectedInvoiceIds\] = useState.*?\n/, '');

// 2. Remove handleCustomerSelect internals related to invoices
content = content.replace(/try {\s*setLoadingInvoices\(true\);[\s\S]*?finally {\s*setLoadingInvoices\(false\);\s*}/, '');

// 3. Remove selectedInvoiceTotalDue and allocations
content = content.replace(/const selectedInvoiceTotalDue = useMemo\(\(\) => \{[\s\S]*?\}, \[selectedInvoiceIds, customerInvoices\]\);/, '');
content = content.replace(/const isPaymentAmountTooHigh =[\s\S]*?selectedInvoiceTotalDue;/, '');
content = content.replace(/const allocations = useMemo\(\(\) => \{[\s\S]*?\}, \[paymentAmount, selectedInvoiceIds, customerInvoices\]\);/, '');
content = content.replace(/const allocatedTotal = allocations\.reduce[\s\S]*?0\);/, '');
content = content.replace(/const remainingSelectedDue = Math\.max[\s\S]*?allocatedTotal\);/, '');

// 4. Remove useEffect for paymentMethod advance
content = content.replace(/useEffect\(\(\) => \{[\s\S]*?if \(paymentMethod === 'advance'\) \{[\s\S]*?\}, \[selectedInvoiceTotalDue, selectedInvoiceIds\.length, paymentMethod, selectedCustomer\]\);/, '');

// 5. Update handleSubmit
const newHandleSubmit = `const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || isSubmitting) return;

    const amount = Number.parseFloat(paymentAmount) || 0;

    if (amount <= 0) {
      toast.error("Payment amount must be greater than 0.");
      return;
    }

    try {
      setIsSubmitting(true);
      await customerService.addBulkPayment(selectedCustomer.id, {
        amount,
        paymentDate,
        method: paymentMethod,
        reference,
        notes,
        attachment,
        attachmentName
      });
      toast.success("Payment recorded successfully!");
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to record payment");
    } finally {
      setIsSubmitting(false);
    }
  };`;
content = content.replace(/const handleSubmit = async \(e: React\.FormEvent\) => \{[\s\S]*?setIsSubmitting\(false\);\s*}\s*};/, newHandleSubmit);

// 6. Update resetForm
content = content.replace(/setCustomerInvoices\(\[\]\);\s*setSelectedInvoiceIds\(\[\]\);/, '');

// 7. Remove totalOutstanding variable (or fix it)
content = content.replace(/const totalOutstanding = customerInvoices\.reduce[\s\S]*?0\);/, '');
// In the JSX, totalOutstanding is used. We should use selectedCustomer.outstanding_amount instead
content = content.replace(/\{totalOutstanding\.toLocaleString\(\)\}/g, '{Number(selectedCustomer.outstanding_amount || 0).toLocaleString()}');
// Remove Pending Bills section in the UI
content = content.replace(/<div className="text-right">[\s\S]*?<p className="text-xl font-black text-blue-900">\{customerInvoices\.length\}<\/p>\s*<\/div>/, '');

// 8. Fix the input field max and onChange logic
const oldInput = `<input
                          type="number"
                          required
                          step="0.01"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-black text-lg text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
                          value={paymentAmount}
                          max={
                            paymentMethod === 'advance'
                              ? Math.min(selectedInvoiceTotalDue, Number(selectedCustomer?.advance_balance || 0))
                              : undefined
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (paymentMethod === 'advance') {
                               const maxLimit = Math.min(selectedInvoiceTotalDue, Number(selectedCustomer?.advance_balance || 0));
                               if (Number(val) > maxLimit) {
                                 toast.error(\`Amount cannot exceed available Advance Balance (Rs \${maxLimit.toLocaleString()})\`);
                                 setPaymentAmount(maxLimit.toString());
                                 return;
                               }
                            }
                            setPaymentAmount(val);
                          }}
                          placeholder={"0"}
                        />`;
const newInput = `<input
                          type="number"
                          required
                          step="0.01"
                          className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:border-blue-600 focus:outline-none font-black text-lg text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          placeholder={"0"}
                        />`;
content = content.replace(oldInput, newInput);

// 9. Remove "Advance Balance" from payment methods dropdown (since we are not paying invoices with advance here anymore, advance usage will be done on Billing page if needed, or maybe just remove it entirely)
// Actually, if we remove invoices, we can't "pay" with advance here. So remove advance option.
content = content.replace(/\{selectedCustomer && Number\(selectedCustomer\.advance_balance \|\| 0\) > 0 && \([\s\S]*?<\/option>\s*\)\}/, '');
content = content.replace(/onChange=\{\(e\) => \{[\s\S]*?setPaymentMethod\(newMethod\);[\s\S]*?\}\}/, 'onChange={(e) => setPaymentMethod(e.target.value)}');

// 10. Remove the entire Invoices to Pay section
// It starts with {/* Invoice Selection & Allocation Preview */}
const invoicesPanelRegex = /\{\/\* Invoice Selection & Allocation Preview \*\/\}.*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/s;
content = content.replace(invoicesPanelRegex, '</div></div>');

// 11. Fix the submit button disabled state
content = content.replace(/disabled=\{\s*isSubmitting \|\|\s*!selectedCustomer \|\|\s*enteredPaymentAmount <= 0 \|\|\s*isPaymentAmountTooHigh \|\|\s*\(paymentMethod === 'advance' && selectedInvoiceIds\.length === 0\)\s*\}/, 'disabled={isSubmitting || !selectedCustomer || (Number.parseFloat(paymentAmount) || 0) <= 0}');

// 12. Fix submit button text
content = content.replace(/selectedInvoiceIds\.length === 0 \? 'RECORD ADVANCE PAYMENT' : 'CONFIRM PAYMENT RECEIPT'/, "'CONFIRM PAYMENT RECEIPT'");

// Remove the grid-cols-2 from the main form layout since the right panel is gone
content = content.replace(/<div className="grid grid-cols-1 md:grid-cols-2 gap-8">/, '<div className="max-w-2xl mx-auto space-y-6">');

fs.writeFileSync(file, content);
