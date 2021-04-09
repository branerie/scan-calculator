;;;  POLYDATA.lsp
;;;
;;;  Udskriver X Y Z koordinater fra samtlige polylines (LWPOLYLINE)
;;;  som findes i tegningen.
;;;
;;;  02.02.11 PTB
;;;  06.09.05 PTB  Min. afstand mellem punkter sat til 0. [((< afst 0) nil)]
;;;  18.06.19 JAMMO Update code for saving .pts on data folder
;;;  18.06.22 JAMMO Panel naming and multiple POLYLINE on single DWG

(defun polydata ()
  ;; get user input
  (setq intHeight (getdist "\nEnter panel height: "))

  (setq old-x 0 old-y 0 count 0 pcount 0 ocount 0 )

  ;;Set variable for polydata pts file on data folder
  (setq filename (strcat "c:\\data\\" (getenv "username") "\\polydata.pts"))

  ;;Open/Create pts file
  (setq f (open filename "w"))

  (setq ent (entnext))
    (while ent
		(setq list1 (entget ent))ppload
		(setq key (cdr (assoc '0 list1)))
		(if (= key "LWPOLYLINE")

		(progn
			(setq level (cdr (assoc '38 list1)))

			;;Setting pane name
			(write-line "var !sOname namn of sbfr" f)
			(write-line "!sOmCount = mcount of sbfr" f)
			(write-line "!sOmCount = !sOmCount + 1" f)

			;;Create new pane
			(write-line "NEW PANE /$!sOname-$!sOmCount" f)
			(write-line "handle any" f)
			(write-line "NEW PANE" f)
			(write-line "endhandle" f)
			(write-line (strcat "BY UP " (rtos level) " WRT/*") f)
			(write-line "NEW PLOO" f)
			(write-line (strcat "HEIG " (rtos intHeight)) f)
			(write-line "SJUST UTOP" f)

			;;Collect points
			(foreach n list1
				(cond
					((= 10 (car n))
						(setq afst
							(sqrt (+ (* (- old-x (cadr n))
									(- old-x (cadr n)))
								 (* (- old-y (caddr n))
									(- old-y (caddr n))))
							)
						)
						(cond
							((< afst 0) nil)
							(t (write-line
								(strcat "NEW PAVE POS E " (rtos (cadr n) 2 0) " N " (rtos (caddr n) 2 0)) f)
								(setq count (+ count 1))
								(setq old-x (cadr n))
								(setq old-y (caddr n))
							)
						)
					)
				)
			)
			(write-line "" f)
			(setq pcount (+ pcount 1))
			(setq ocount (+ ocount count))
			(write-line (strcat "Poly(" (rtos pcount) ") Antal punkter: " (rtos count)))
		)
    )
    (setq ent (entnext ent))
	)
   (if f (close f))

  ;;Copy polydata.pst to dwg folder
  (vl-file-delete (strcat (getvar "dwgprefix") (vl-filename-base (getvar "dwgname")) ".pts"))
  (vl-file-copy (strcat filename) (strcat (getvar "dwgprefix") (vl-filename-base (getvar "dwgname")) ".pts") T)
  (write-line (strcat "Total points : " (rtos ocount)))
  (write-line "")

)
