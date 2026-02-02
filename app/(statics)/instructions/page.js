export const metadata = {
  title: 'Οδηγίες Χρήσης - Απόφαση',
  description: 'Μάθετε πώς να χρησιμοποιείτε την πλατφόρμα Απόφαση και πώς να δημιουργείτε άρθρα',
};

export default function InstructionsPage() {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="app-container">
        <h1 className="text-4xl font-bold mb-8">Οδηγίες Χρήσης</h1>

        <div className="card p-8">
          <div className="max-w-4xl space-y-12">
            {/* Section 1: Introduction */}
            <section>
              <h2 className="text-2xl font-semibold mb-3">Καλώς ήρθατε στην Απόφαση</h2>
              <p className="text-gray-700 mb-4">
                Η πλατφόρμα Απόφαση σας επιτρέπει να δημιουργείτε και να μοιράζεστε άρθρα και ειδήσεις με την κοινότητα.
                Αυτός ο οδηγός θα σας βοηθήσει να κατανοήσετε πώς να χρησιμοποιείτε όλες τις λειτουργίες της πλατφόρμας.
              </p>
            </section>

            {/* Section 2: Getting Started */}
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-3">Πώς να ξεκινήσετε</h2>
                <p className="text-gray-700 mb-4">
                  Για να δημιουργήσετε ένα άρθρο, πρέπει πρώτα να συνδεθείτε στον λογαριασμό σας. Εάν δεν έχετε λογαριασμό,
                  μπορείτε να δημιουργήσετε έναν κάνοντας κλικ στο κουμπί "Εγγραφή" στην κορυφή της σελίδας.
                </p>
                <ol className="list-decimal pl-6 text-gray-700 space-y-3">
                  <li>Συνδεθείτε στον λογαριασμό σας</li>
                  <li>Κάντε κλικ στο μενού χρήστη (Hello [όνομα χρήστη]) στην πάνω δεξιά γωνία</li>
                  <li>Επιλέξτε "New Article" για να μεταβείτε στον επεξεργαστή</li>
                  <li>Κάντε κλικ στο κουμπί "Προβολή φόρμας" για να εμφανίσετε τη φόρμα δημιουργίας άρθρου</li>
                </ol>
              </div>
            </section>

            {/* Section 3: Article Fields */}
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Κατανόηση των πεδίων του άρθρου</h2>
                <p className="text-gray-700 mb-6">
                  Η φόρμα δημιουργίας άρθρου χωρίζεται σε τέσσερις ενότητες. Ας δούμε κάθε πεδίο αναλυτικά:
                </p>
              </div>

              {/* Mandatory Fields */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-3 text-blue-900">1. Υποχρεωτικά Πεδία</h3>
                <p className="text-gray-700 mb-4">
                  Αυτά τα πεδία είναι απαραίτητα για τη δημιουργία ενός άρθρου:
                </p>

                <div className="space-y-4 pl-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Τίτλος *</h4>
                    <p className="text-gray-700 mb-2">
                      Ο κύριος τίτλος του άρθρου σας. Πρέπει να είναι σαφής, περιεκτικός και ελκυστικός.
                    </p>
                    <p className="text-sm text-gray-600 italic">
                      Παράδειγμα: "Νέες εξελίξεις στην τεχνολογία τεχνητής νοημοσύνης"
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Περιεχόμενο *</h4>
                    <p className="text-gray-700 mb-2">
                      Το κύριο σώμα του άρθρου σας. Εδώ γράφετε το πλήρες περιεχόμενο του άρθρου σας.
                    </p>
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-3">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Συμβουλές για το Περιεχόμενο:</p>
                      <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1">
                        <li>Χρησιμοποιήστε σαφή και απλή γλώσσα</li>
                        <li>Οργανώστε το κείμενό σας σε παραγράφους</li>
                        <li>Ξεκινήστε με μια ελκυστική εισαγωγή</li>
                        <li>Χρησιμοποιήστε παραδείγματα και στοιχεία όταν είναι δυνατόν</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Κατάσταση *</h4>
                    <p className="text-gray-700 mb-2">
                      Επιλέξτε την κατάσταση του άρθρου σας:
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-2">
                      <li><span className="font-semibold">Πρόχειρο:</span> Το άρθρο δεν είναι ακόμα έτοιμο για δημοσίευση. Μόνο εσείς μπορείτε να το δείτε.</li>
                      <li><span className="font-semibold">Δημοσιευμένο:</span> Το άρθρο είναι ορατό σε όλους τους χρήστες της πλατφόρμας.</li>
                      <li><span className="font-semibold">Αρχειοθετημένο:</span> Το άρθρο δεν εμφανίζεται πια στις κύριες λίστες αλλά παραμένει προσβάσιμο.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Categories and Tags */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-3 text-blue-900">2. Κατηγορίες & Ετικέτες</h3>
                
                <div className="space-y-4 pl-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Κατηγορία</h4>
                    <p className="text-gray-700 mb-2">
                      Η κύρια θεματική κατηγορία του άρθρου σας. Βοηθά τους αναγνώστες να βρουν σχετικό περιεχόμενο.
                    </p>
                    <p className="text-sm text-gray-600 italic">
                      Παραδείγματα: Τεχνολογία, Πολιτική, Αθλητισμός, Πολιτισμός, Οικονομία
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Ετικέτες (Tags)</h4>
                    <p className="text-gray-700 mb-2">
                      Λέξεις-κλειδιά που σχετίζονται με το άρθρο σας. Διαχωρίστε πολλαπλές ετικέτες με κόμματα.
                    </p>
                    <p className="text-sm text-gray-600 italic">
                      Παράδειγμα: τεχνητή νοημοσύνη, μηχανική μάθηση, καινοτομία
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Options */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-3 text-blue-900">3. Επιπλέον Επιλογές</h3>
                <p className="text-gray-700 mb-4">
                  Αυτά τα πεδία είναι προαιρετικά αλλά μπορούν να βελτιώσουν την εμφάνιση και τη χρηστικότητα του άρθρου σας:
                </p>

                <div className="space-y-4 pl-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Υπότιτλος</h4>
                    <p className="text-gray-700 mb-2">
                      Ένας δευτερεύων τίτλος που παρέχει επιπλέον πληροφορίες ή πλαίσιο για το άρθρο.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Περίληψη</h4>
                    <p className="text-gray-700 mb-2">
                      Μια σύντομη περιγραφή του άρθρου (1-2 προτάσεις). Εμφανίζεται στις λίστες άρθρων και βοηθά τους αναγνώστες
                      να αποφασίσουν αν θέλουν να διαβάσουν περισσότερα.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Χρόνος ανάγνωσης (λεπτά)</h4>
                    <p className="text-gray-700 mb-2">
                      Εκτιμώμενος χρόνος που χρειάζεται για να διαβαστεί το άρθρο. Βοηθά τους αναγνώστες να αποφασίσουν αν έχουν χρόνο να το διαβάσουν τώρα.
                    </p>
                    <p className="text-sm text-gray-600 italic">
                      Συμβουλή: Υπολογίστε περίπου 200-250 λέξεις ανά λεπτό ανάγνωσης.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Εικόνα Εξωφύλλου</h4>
                    <p className="text-gray-700 mb-2">
                      Μπορείτε να προσθέσετε μια εικόνα που θα εμφανίζεται ως εξώφυλλο του άρθρου:
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
                      <li><span className="font-semibold">URL Εικόνας Εξωφύλλου:</span> Εισάγετε τη διεύθυνση URL μιας εικόνας (π.χ. https://example.com/image.jpg)</li>
                      <li><span className="font-semibold">Λεζάντα Εικόνας:</span> Προαιρετική περιγραφή της εικόνας που εμφανίζεται κάτω από αυτήν</li>
                    </ul>
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 my-3">
                      <p className="text-sm font-semibold text-yellow-900 mb-2">Σημείωση για Εικόνες:</p>
                      <p className="text-sm text-gray-700">
                        Η πλατφόρμα θα εμφανίσει μια προεπισκόπηση της εικόνας μόλις εισάγετε το URL. Αν η εικόνα δεν
                        φορτώσει, ελέγξτε ότι το URL είναι σωστό και προσβάσιμο.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Πηγή</h4>
                    <p className="text-gray-700 mb-2">
                      Αν το άρθρο σας βασίζεται σε κάποια εξωτερική πηγή, μπορείτε να την αναφέρετε:
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
                      <li><span className="font-semibold">Πηγή:</span> Το όνομα του μέσου ή του οργανισμού (π.χ. Reuters, BBC)</li>
                      <li><span className="font-semibold">URL Πηγής:</span> Ο σύνδεσμος προς το αρχικό άρθρο ή την πηγή</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Επιλογές Χαρακτηριστικών</h4>
                    <p className="text-gray-700 mb-2">
                      Δύο σημαντικά checkboxes που επηρεάζουν τον τρόπο εμφάνισης του άρθρου:
                    </p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-2">
                      <li>
                        <span className="font-semibold">Σήμανση ως είδηση:</span> Επιλέξτε αυτό αν το άρθρο σας είναι είδηση.
                        <span className="text-orange-700"> Σημείωση: Οι ειδήσεις απαιτούν έγκριση από moderator ή admin πριν δημοσιευτούν στην ενότητα ειδήσεων.</span>
                      </li>
                      <li>
                        <span className="font-semibold">Προτεινόμενο άρθρο:</span> Επισημαίνει το άρθρο ως ιδιαίτερα σημαντικό ή ενδιαφέρον.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-3 text-blue-900">4. Τοποθεσία (Προαιρετικό)</h3>
                <p className="text-gray-700 mb-2">
                  Μπορείτε να συσχετίσετε το άρθρο σας με μια συγκεκριμένη γεωγραφική τοποθεσία:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Επιλέξτε μια τοποθεσία από το dropdown μενού</li>
                  <li>Ή επιλέξτε "Χρήση τοποθεσίας χρήστη" για να χρησιμοποιήσετε την προεπιλεγμένη τοποθεσία του προφίλ σας</li>
                </ul>
              </div>
            </section>

            {/* Section 4: Adding Media */}
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-3">Πώς να προσθέσετε φωτογραφίες και βίντεο</h2>
                <p className="text-gray-700 mb-4">
                  Η πλατφόρμα υποστηρίζει διάφορους τρόπους για να εμπλουτίσετε το περιεχόμενό σας με πολυμέσα:
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-3">Προσθήκη εικόνων στο Περιεχόμενο</h3>
                <p className="text-gray-700 mb-3">
                  Μπορείτε να ενσωματώσετε εικόνες στο κείμενο του άρθρου σας χρησιμοποιώντας σύνταξη HTML:
                </p>
                
                <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                  <code className="text-gray-800">
                    {'<img src="https://example.com/photo.jpg" alt="Περιγραφή εικόνας" />'}
                  </code>
                </div>

                <p className="text-gray-700 mt-3">
                  Μπορείτε επίσης να προσθέσετε στυλ για καλύτερη εμφάνιση:
                </p>

                <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                  <code className="text-gray-800">
                    {'<img src="https://example.com/photo.jpg" alt="Περιγραφή" style="max-width: 100%; height: auto; border-radius: 8px;" />'}
                  </code>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-3">Ενσωμάτωση βίντεο</h3>
                <p className="text-gray-700 mb-3">
                  Για να προσθέσετε βίντεο από πλατφόρμες όπως το YouTube, χρησιμοποιήστε τον κώδικα ενσωμάτωσης (embed code):
                </p>

                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Παράδειγμα YouTube:</p>
                    <div className="bg-gray-100 p-4 rounded-md font-mono text-sm overflow-x-auto">
                      <code className="text-gray-800">
                        {'<iframe width="560" height="315" src="https://www.youtube.com/embed/VIDEO_ID" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'}
                      </code>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Πώς να βρείτε τον κώδικα ενσωμάτωσης:</p>
                    <ol className="list-decimal pl-6 text-sm text-gray-700 space-y-1">
                      <li>Μεταβείτε στο βίντεο που θέλετε να ενσωματώσετε</li>
                      <li>Κάντε κλικ στο κουμπί "Κοινή χρήση" ή "Share"</li>
                      <li>Επιλέξτε "Ενσωμάτωση" ή "Embed"</li>
                      <li>Αντιγράψτε τον κώδικα και επικολλήστε τον στο πεδίο Περιεχόμενο</li>
                    </ol>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: Formatting Text */}
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-3">Πώς να μορφοποιήσετε το κείμενο</h2>
                <p className="text-gray-700 mb-4">
                  Μπορείτε να χρησιμοποιήσετε HTML tags για να μορφοποιήσετε το περιεχόμενό σας:
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold mb-3">Κοινές μορφοποιήσεις</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Επικεφαλίδες (Headers):</p>
                    <div className="bg-gray-100 p-4 rounded-md font-mono text-sm space-y-1">
                      <div><code className="text-gray-800">{'<h2>Μεγάλη Επικεφαλίδα</h2>'}</code></div>
                      <div><code className="text-gray-800">{'<h3>Μεσαία Επικεφαλίδα</h3>'}</code></div>
                      <div><code className="text-gray-800">{'<h4>Μικρή Επικεφαλίδα</h4>'}</code></div>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Έμφαση κειμένου:</p>
                    <div className="bg-gray-100 p-4 rounded-md font-mono text-sm space-y-1">
                      <div><code className="text-gray-800">{'<strong>Έντονο κείμενο</strong>'}</code></div>
                      <div><code className="text-gray-800">{'<em>Πλάγιο κείμενο</em>'}</code></div>
                      <div><code className="text-gray-800">{'<u>Υπογραμμισμένο κείμενο</u>'}</code></div>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Λίστες:</p>
                    <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                      <code className="text-gray-800">
                        {'<ul>\n  <li>Πρώτο στοιχείο</li>\n  <li>Δεύτερο στοιχείο</li>\n  <li>Τρίτο στοιχείο</li>\n</ul>'}
                      </code>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Αριθμημένες λίστες:</p>
                    <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                      <code className="text-gray-800">
                        {'<ol>\n  <li>Πρώτο βήμα</li>\n  <li>Δεύτερο βήμα</li>\n  <li>Τρίτο βήμα</li>\n</ol>'}
                      </code>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Σύνδεσμοι (Links):</p>
                    <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                      <code className="text-gray-800">
                        {'<a href="https://example.com">Κείμενο συνδέσμου</a>'}
                      </code>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Παραγράφοι:</p>
                    <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                      <code className="text-gray-800">
                        {'<p>Αυτή είναι μια παράγραφος κειμένου.</p>'}
                      </code>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Αλλαγή γραμμής:</p>
                    <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                      <code className="text-gray-800">
                        {'Πρώτη γραμμή<br />Δεύτερη γραμμή'}
                      </code>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-gray-800 mb-2">Παράθεση (Quote):</p>
                    <div className="bg-gray-100 p-4 rounded-md font-mono text-sm">
                      <code className="text-gray-800">
                        {'<blockquote>Αυτό είναι ένα σημαντικό απόσπασμα ή παράθεση.</blockquote>'}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6: Tips and Best Practices */}
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-3">Συμβουλές και βέλτιστες πρακτικές</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Γράφοντας καλό περιεχόμενο</h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Χρησιμοποιήστε σαφείς και περιεκτικούς τίτλους που περιγράφουν ακριβώς το περιεχόμενο</li>
                    <li>Χωρίστε το μεγάλο κείμενο σε παραγράφους για καλύτερη αναγνωσιμότητα</li>
                    <li>Χρησιμοποιήστε επικεφαλίδες για να οργανώσετε το περιεχόμενό σας σε ενότητες</li>
                    <li>Προσθέστε εικόνες ή βίντεο για να κάνετε το άρθρο πιο ενδιαφέρον</li>
                    <li>Ελέγξτε την ορθογραφία και τη γραμματική πριν δημοσιεύσετε</li>
                    <li>Αναφέρετε πάντα τις πηγές σας όταν χρησιμοποιείτε πληροφορίες από αλλού</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Τεχνικές συμβουλές</h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Χρησιμοποιήστε εικόνες υψηλής ποιότητας που φορτώνουν γρήγορα</li>
                    <li>Βεβαιωθείτε ότι τα URLs των εικόνων είναι έγκυρα και προσβάσιμα</li>
                    <li>Δοκιμάστε τους συνδέσμους σας πριν δημοσιεύσετε</li>
                    <li>Αποθηκεύστε το άρθρο ως "Πρόχειρο" ενώ το δουλεύετε</li>
                    <li>Προεπισκοπήστε το άρθρο σας πριν το κάνετε "Δημοσιευμένο"</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">Κανόνες κοινότητας</h3>
                  <ul className="list-disc pl-6 text-gray-700 space-y-2">
                    <li>Σεβαστείτε τους κανόνες της πλατφόρμας (δείτε τη σελίδα <a href="/rules" className="text-blue-600 hover:underline">Κανόνες</a>)</li>
                    <li>Μην δημοσιεύετε παραπλανητικό ή ψευδές περιεχόμενο</li>
                    <li>Σεβαστείτε τα πνευματικά δικαιώματα άλλων</li>
                    <li>Αποφύγετε το spam και το διπλότυπο περιεχόμενο</li>
                    <li>Αλληλεπιδράστε με σεβασμό με άλλους χρήστες</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 7: After Publishing */}
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-3">Μετά τη δημοσίευση</h2>
                <p className="text-gray-700 mb-4">
                  Αφού δημοσιεύσετε το άρθρο σας, μπορείτε να:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Δείτε το στη λίστα "Πρόσφατα Άρθρα" στον επεξεργαστή</li>
                  <li>Κάντε κλικ στο "Προβολή" για να δείτε πώς φαίνεται το άρθρο σας</li>
                  <li>Επεξεργαστείτε το ανά πάσα στιγμή αν χρειάζεται (προσεχώς)</li>
                  <li>Διαγράψτε το αν δεν το θέλετε πια (μόνο εσείς ή οι διαχειριστές)</li>
                  <li>Παρακολουθήστε πώς αλληλεπιδρούν οι αναγνώστες με το περιεχόμενό σας</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Έγκριση ειδήσεων</h3>
                <p className="text-gray-700 mb-3">
                  Αν επιλέξατε "Σήμανση ως είδηση":
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Το άρθρο θα έχει την κατάσταση "Εκκρεμής είδηση"</li>
                  <li>Ένας moderator ή admin θα πρέπει να το εγκρίνει</li>
                  <li>Μόλις εγκριθεί, θα εμφανιστεί ως "Εγκεκριμένη είδηση"</li>
                  <li>Μόνο εγκεκριμένες ειδήσεις εμφανίζονται στην ενότητα Ειδήσεις</li>
                </ul>
              </div>
            </section>

            {/* Section 8: Need Help */}
            <section className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
              <h2 className="text-2xl font-semibold mb-3">Χρειάζεστε βοήθεια;</h2>
              <p className="text-gray-700 mb-3">
                Αν έχετε ερωτήσεις ή αντιμετωπίζετε προβλήματα, μπορείτε να:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Επισκεφθείτε τη σελίδα <a href="/contact" className="text-blue-600 hover:underline font-semibold">Επικοινωνία</a> για να επικοινωνήσετε μαζί μας</li>
                <li>Διαβάστε την <a href="/mission" className="text-blue-600 hover:underline font-semibold">Αποστολή</a> μας για να καταλάβετε καλύτερα την πλατφόρμα</li>
                <li>Ελέγξτε τους <a href="/rules" className="text-blue-600 hover:underline font-semibold">Κανόνες</a> για οδηγίες χρήσης</li>
                <li>Μάθετε πώς μπορείτε να <a href="/contribute" className="text-blue-600 hover:underline font-semibold">Συνεισφέρετε</a> στην κοινότητα</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
