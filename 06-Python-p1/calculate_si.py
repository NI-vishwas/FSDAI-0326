#from first import calc_si as si
import first

princ = 30000
tme = 36
#rates_of_interest = [0.07,0.05,0.25,0.37]
banks = {"B1": 0.07,"B2":0.05,"B3":0.25,"B4":0.37}
# Taking the item directly
for itm in rates_of_interest:
    print(first.calc_si(princ,itm,tme))

# This access the items through index
for idx in range(len(rates_of_interest)):
    print(first.calc_si(princ,rates_of_interest[idx],tme))