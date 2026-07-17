const fs = require('fs');
const file = 'src/app/components/Payments.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove states
content = content.replace(/const \[customerInvoices, setCustomerInvoices\] = useState.*?;\n/g, '');
content = content.replace(/const \[loadingInvoices, setLoadingInvoices\] = useState.*?;\n/g, '');
content = content.replace(/const \[selectedInvoiceIds, setSelectedInvoiceIds\] = useState.*?;\n/g, '');

// 2. Remove handleCustomerSelect internals related to invoices
content = content.replace(/try \{\s*setLoadingInvoices\(true\);[\s\S]*?finally \{\s*setLoadingInvoices\(false\);\s*\}\s*\}/g, '}');
content = content.replace(/setCustomerInvoices\(\[\]\);\s*setSelectedInvoiceIds\(\[\]\);/g, '');

// 3. Remove selectedInvoiceTotalDue and allocations
content = content.replace(/const selectedInvoiceTotalDue = useMemo\(\(\) => \{[\s\S]*?\}, \[selectedInvoiceIds, customerInvoices\]\);/, '');
content = content.replace(/const isPaymentAmountTooHigh =[\s\S]*?selectedInvoiceTotalDue;/, '');
content = content.replace(/const allocations = useMemo\(\(\) => \{[\s\S]*?\}, \[paymentAmount, selectedInvoiceIds, customerInvoices\]\);/, '');
content = content.replace(/const allocatedTotal = allocations\.reduce[\s\S]*?0\);/, '');
content = content.replace(/const remainingSelectedDue = Math\.max[\s\S]*?allocatedTotal\);/, '');
content = content.replace(/const totalOutstanding = customerInvoices\.reduce[\s\S]*?0\);/, '');

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

// 7. Remove Pending Bills section in the UI and update totalOutstanding
content = content.replace(/\{totalOutstanding\.toLocaleString\(\)\}/g, '{Number(selectedCustomer.outstanding_amount || 0).toLocaleString()}');
content = content.replace(/<div className="text-right">[\s\S]*?<p className="text-xl font-black text-blue-900">\{customerInvoices\.length\}<\/p>\s*<\/div>/, '');

// 8. Fix the input field max and onChange logic
content = content.replace(/max=\{[\s\S]*?undefined\s*\}/, '');
content = content.replace(/onChange=\{\(e\) => \{[\s\S]*?setPaymentAmount\(val\);\s*\}\}/, 'onChange={(e) => setPaymentAmount(e.target.value)}');

// 9. Remove "Advance Balance" from payment methods dropdown
content = content.replace(/\{selectedCustomer && Number\(selectedCustomer\.advance_balance \|\| 0\) > 0 && \([\s\S]*?<\/option>\s*\)\}/, '');
content = content.replace(/onChange=\{\(e\) => \{[\s\S]*?setPaymentMethod\(newMethod\);[\s\S]*?\}\}/, 'onChange={(e) => setPaymentMethod(e.target.value)}');

// 10. Remove the entire Invoices to Pay section
// Because of its complexity, let's just strip everything after the `</div>` of the left panel until the submit button div.
content = content.replace(/\{\/\* Invoice Selection & Allocation Preview \*\/\}.*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/s, '</div></div>');

// 11. Fix the submit button disabled state
content = content.replace(/disabled=\{\s*isSubmitting \|\|\s*!selectedCustomer \|\|\s*enteredPaymentAmount <= 0 \|\|\s*isPaymentAmountTooHigh \|\|\s*\(paymentMethod === 'advance' && selectedInvoiceIds\.length === 0\)\s*\}/, 'disabled={isSubmitting || !selectedCustomer || (Number.parseFloat(paymentAmount) || 0) <= 0}');

// 12. Fix submit button text
content = content.replace(/selectedInvoiceIds\.length === 0 \? 'RECORD ADVANCE PAYMENT' : 'CONFIRM PAYMENT RECEIPT'/, "'CONFIRM PAYMENT RECEIPT'");

// Remove the grid-cols-2 from the main form layout since the right panel is gone
content = content.replace(/<div className="grid grid-cols-1 md:grid-cols-2 gap-8">/, '<div className="max-w-2xl mx-auto space-y-6">');

// Also remove `Allocation` interface
content = content.replace(/interface Allocation \{[\s\S]*?\}/, '');

fs.writeFileSync(file, content);
